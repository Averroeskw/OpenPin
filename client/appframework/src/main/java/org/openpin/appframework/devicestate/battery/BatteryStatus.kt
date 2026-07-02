package org.openpin.appframework.devicestate.battery

import android.content.Intent
import kotlin.math.roundToInt
import android.os.BatteryManager as AndroidBatteryManager

data class BatteryStatus(
    val percentage: Float,
    val isCharging: Boolean
) {
    /**
     * Canonical whole-number battery percentage (0-100).
     *
     * Every user-facing surface (laser display, backend request metadata,
     * alerts) must derive its number from this value so they can never
     * disagree about the same underlying reading.
     */
    val percent: Int
        get() = (percentage * 100).roundToInt()

    companion object {
        /**
         * Parses a [BatteryStatus] from an [Intent.ACTION_BATTERY_CHANGED] intent.
         * Returns null if the intent doesn't carry valid level/scale extras,
         * so callers never see a fabricated percentage.
         */
        fun fromIntent(intent: Intent): BatteryStatus? {
            val level = intent.getIntExtra(AndroidBatteryManager.EXTRA_LEVEL, -1)
            val scale = intent.getIntExtra(AndroidBatteryManager.EXTRA_SCALE, -1)
            if (level < 0 || scale <= 0) return null

            val status = intent.getIntExtra(AndroidBatteryManager.EXTRA_STATUS, -1)
            val isCharging = status == AndroidBatteryManager.BATTERY_STATUS_CHARGING ||
                    status == AndroidBatteryManager.BATTERY_STATUS_FULL

            return BatteryStatus(
                percentage = level.toFloat() / scale.toFloat(),
                isCharging = isCharging
            )
        }
    }
}
