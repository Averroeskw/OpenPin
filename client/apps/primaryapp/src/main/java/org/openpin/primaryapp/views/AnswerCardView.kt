package org.openpin.primaryapp.views

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.openpin.appframework.ui.components.CrossfadeText
import org.openpin.appframework.ui.components.ScrollContainer

/**
 * Full-screen "answer card" projected while the assistant reply is being
 * spoken: the reply text in large monochrome type. Long answers overflow
 * into the standard [ScrollContainer] scroll affordances.
 *
 * The card carries no dismiss logic of its own; the caller pushes it when
 * reply playback starts and pops it when playback finishes or is cancelled.
 */
@Composable
fun AnswerCardView(text: String) {
    ScrollContainer {
        Spacer(modifier = Modifier.height(30.dp))
        CrossfadeText(
            text = text,
            size = 64.sp,
        )
        Spacer(modifier = Modifier.height(30.dp))
    }
}
