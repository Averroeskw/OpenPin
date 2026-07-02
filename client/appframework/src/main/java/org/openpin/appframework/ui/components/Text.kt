package org.openpin.appframework.ui.components

import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import org.openpin.appframework.ui.locals.LocalContentColor
import org.openpin.appframework.ui.locals.LocalUIConfig

/**
 * Returns true if the string contains any Arabic-script characters
 * (Arabic, Arabic Supplement, Arabic Extended-A/B, and the Arabic
 * Presentation Forms blocks).
 */
private fun containsArabic(text: String): Boolean = text.any { ch ->
    when (ch.code) {
        in 0x0600..0x06FF, // Arabic
        in 0x0750..0x077F, // Arabic Supplement
        in 0x0870..0x089F, // Arabic Extended-B
        in 0x08A0..0x08FF, // Arabic Extended-A
        in 0xFB50..0xFDFF, // Arabic Presentation Forms-A
        in 0xFE70..0xFEFF  // Arabic Presentation Forms-B
        -> true
        else -> false
    }
}

@Composable
fun Text(
    text: String,
    modifier: Modifier = Modifier,
    size: TextUnit? = null,
    weight: FontWeight? = null,
    align: TextAlign = TextAlign.Unspecified,
    maxLines: Int = Int.MAX_VALUE,
    softWrap: Boolean = true,
    overflow: TextOverflow = TextOverflow.Clip
) {
    val config = LocalUIConfig.current.text

    // Poppins has no Arabic glyph coverage; swap to the Arabic-capable
    // family whenever Arabic script is present so every view renders it.
    val isArabic = remember(text) { containsArabic(text) }
    val fontFamily = if (isArabic) config.arabicFontFamily else config.fontFamily

    BasicText(
        text = text,
        style = TextStyle(
            // Resolve alignment from the paragraph's content: TextAlign.Start
            // (and Unspecified) follow the resolved text direction, so Arabic
            // aligns right and Latin aligns left with no per-view changes.
            textAlign = align,
            // Lay the paragraph out by its content: Arabic strings run RTL,
            // Latin strings run LTR, and mixed strings follow their first
            // strong directional character.
            textDirection = TextDirection.Content,
            fontFamily = fontFamily,
            fontSize = size ?: config.fontSize,
            fontWeight = weight ?: config.fontWeight,
            color = LocalContentColor.current
        ),
        modifier = modifier,
        maxLines = maxLines,
        softWrap = softWrap,
        overflow = overflow
    )
}
