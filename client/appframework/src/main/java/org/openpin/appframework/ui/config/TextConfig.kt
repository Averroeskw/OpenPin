package org.openpin.appframework.ui.config

import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp

data class TextConfig(
    val fontFamily: FontFamily = PoppinsFontFamily,
    /** Font family used when the text contains Arabic-script characters. */
    val arabicFontFamily: FontFamily = NotoSansArabicFontFamily,
    val fontSize: TextUnit = 70.sp,
    val fontWeight: FontWeight = FontWeight.Black
)
