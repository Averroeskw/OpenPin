package org.openpin.primaryapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import org.openpin.appframework.devicestate.battery.BatteryStatus
import org.openpin.appframework.media.soundplayer.SoundPlayer
import org.openpin.appframework.media.soundplayer.SystemSound
import java.io.Closeable

/**
 * Plays an audible chime when the battery drops to 20%, 10% and 5% while
 * discharging. Each threshold fires at most once per discharge cycle;
 * charging (or recovering above all thresholds) re-arms the alerts.
 *
 * Uses the same [BatteryStatus] parsing as every other battery consumer,
 * so the alert can never disagree with the displayed or reported percent.
 */
class LowBatteryAlerter(
    private val context: Context,
    private val soundPlayer: SoundPlayer,
) : Closeable {

    private val thresholds = listOf(20, 10, 5)
    private var lastAlertedThreshold: Int? = null
    private var registered = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            BatteryStatus.fromIntent(intent)?.let { onStatus(it) }
        }
    }

    fun start() {
        if (registered) return
        // ACTION_BATTERY_CHANGED is sticky, so we get the current
        // status immediately and updates from then on.
        context.registerReceiver(receiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        registered = true
    }

    private fun onStatus(status: BatteryStatus) {
        // Find the lowest threshold we are currently at or below
        val crossed = thresholds.lastOrNull { status.percent <= it }

        if (status.isCharging || crossed == null) {
            // Charging or recovered above all thresholds: re-arm
            lastAlertedThreshold = null
            return
        }

        val last = lastAlertedThreshold
        if (last == null || crossed < last) {
            lastAlertedThreshold = crossed
            Log.i(
                "LowBatteryAlerter",
                "Battery at ${status.percent}%, playing low battery alert ($crossed% threshold)"
            )
            soundPlayer.play(SystemSound.LOW_BATTERY.key)
        }
    }

    override fun close() {
        if (!registered) return
        registered = false
        context.unregisterReceiver(receiver)
    }
}
