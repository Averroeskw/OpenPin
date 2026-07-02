import * as MsftSpeech from "microsoft-cognitiveservices-speech-sdk";
import axios from "axios";
import { MSFT_TTS_FORMAT, MSFT_TTS_REGION } from "src/config";
import { transcodeToOgg } from "../audio";
import {
  env,
  getOpenaiSpeechBase,
  getOpenaiSpeechHeaders,
  resolveSpeechProvider,
} from "./provider";

export const getMsftSpeechConfig = () => {
  const speechConfig = MsftSpeech.SpeechConfig.fromSubscription(
    process.env.MSFT_SPEECH_KEY as string,
    MSFT_TTS_REGION
  );

  speechConfig.speechSynthesisOutputFormat = MSFT_TTS_FORMAT;

  return speechConfig;
};

export const getSynthesizer = () => {
  const config = getMsftSpeechConfig();

  return new MsftSpeech.SpeechSynthesizer(config);
};

export interface SynthesisConfig {
  speed: number;
  voiceName: string;
  language: string;
}

const speakAzure = async (
  text: string,
  config: SynthesisConfig
): Promise<Buffer> => {
  const synthesizer = getSynthesizer();

  const ssml = `
  <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${config.language}">
    <voice name="${config.voiceName}">
      <prosody rate="${config.speed}">${text}</prosody>
    </voice>
  </speak>`;

  return new Promise((resolve, reject) => {
    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close();
        resolve(Buffer.from(result.audioData));
      },
      (error) => {
        synthesizer.close();
        reject(error);
      }
    );
  });
};

/*
 * Any OpenAI-compatible /audio/speech endpoint.
 *
 * The voice comes from OPENAI_TTS_VOICE (the dashboard voice picker maps to
 * Azure voice names, which mean nothing to other providers); `config.language`
 * has no equivalent parameter and is ignored. `config.speed` is passed
 * through — both Azure prosody rate and the OpenAI `speed` field are 1.0-based
 * multipliers.
 *
 * We request Ogg/Opus and then transcode to 16 kHz mono Ogg so the rest of
 * the pipeline (ffmpeg post-processing + the device) sees the same audio
 * profile Azure produces (Ogg16Khz16BitMonoOpus).
 */
const speakOpenai = async (
  text: string,
  config: SynthesisConfig
): Promise<Buffer> => {
  const response = await axios.post(
    `${getOpenaiSpeechBase()}/audio/speech`,
    {
      model: env("OPENAI_TTS_MODEL") ?? "tts-1",
      voice: env("OPENAI_TTS_VOICE") ?? "alloy",
      input: text,
      response_format: "opus",
      speed: Math.min(Math.max(config.speed, 0.25), 4),
    },
    {
      headers: getOpenaiSpeechHeaders(),
      responseType: "arraybuffer",
    }
  );

  return transcodeToOgg(Buffer.from(response.data), {
    sampleRate: 16000,
    channels: 1,
  });
};

export const speak = async (
  text: string,
  config: SynthesisConfig
): Promise<Buffer> => {
  switch (resolveSpeechProvider()) {
  case "openai":
    return speakOpenai(text, config);
  case "azure":
    return speakAzure(text, config);
  }
};
