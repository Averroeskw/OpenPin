package org.openpin.appframework.ui.config

import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import org.openpin.appframework.R

val PoppinsFontFamily = FontFamily(
    Font(R.font.poppins_light, FontWeight.Light),
    Font(R.font.poppins_regular, FontWeight.Normal),
    Font(R.font.poppins_medium, FontWeight.Medium),
    Font(R.font.poppins_semi_bold, FontWeight.SemiBold),
    Font(R.font.poppins_bold, FontWeight.Bold),
    Font(R.font.poppins_extra_bold, FontWeight.ExtraBold),
    Font(R.font.poppins_black, FontWeight.Black)
)

/**
 * Noto Sans Arabic (SIL OFL 1.1) — used for Arabic-script text, since
 * Poppins has no Arabic glyph coverage. Weights mirror [PoppinsFontFamily].
 */
val NotoSansArabicFontFamily = FontFamily(
    Font(R.font.noto_sans_arabic_light, FontWeight.Light),
    Font(R.font.noto_sans_arabic_regular, FontWeight.Normal),
    Font(R.font.noto_sans_arabic_medium, FontWeight.Medium),
    Font(R.font.noto_sans_arabic_semi_bold, FontWeight.SemiBold),
    Font(R.font.noto_sans_arabic_bold, FontWeight.Bold),
    Font(R.font.noto_sans_arabic_extra_bold, FontWeight.ExtraBold),
    Font(R.font.noto_sans_arabic_black, FontWeight.Black)
)
