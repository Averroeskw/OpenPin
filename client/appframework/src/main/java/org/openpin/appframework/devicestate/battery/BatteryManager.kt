package org.openpin.appframework.devicestate.battery

import android.content.Context
import android.content.Intent
import android.content.IntentFilter

class BatteryManager(private val context: Context) {

    val status: BatteryStatus
        get() {
            val intentFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatusIntent = context.registerReceiver(null, intentFilter)

            return batteryStatusIntent?.let { BatteryStatus.fromIntent(it) }
                ?: BatteryStatus(percentage = 0.0f, isCharging = false)
        }
}
