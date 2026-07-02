import axios from "axios";
import { GROQ_SST_MODEL } from "src/config";
import FormData from "form-data";
import { getPeakVolume } from "../audio";
import { WHISPER_MIN_DB } from "src/config/speechRecognition";
import {
  env,
  getOpenaiSpeechBase,
  getOpenaiSpeechHeaders,
  resolveSpeechProvider,
} from "./provider";

export class NoRecognitionError extends Error {
  constructor(message = "No speech recognized") {
    super(message);
    this.name = "NoRecognitionError";
  }
}

// Stock ("azure") pipeline: Whisper hosted on Groq
const recognizeGroq = async (audioBuffer: Buffer): Promise<string> => {
  const whisperClient = axios.create({
    baseURL: "https://api.groq.com/openai/v1",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_KEY as string}`,
    },
  });

  const formData = new FormData();
  formData.append("file", audioBuffer, "audio.ogg");
  formData.append("model", GROQ_SST_MODEL);

  const response = await whisperClient.post("/audio/transcriptions", formData);

  return response.data.text;
};

// Any OpenAI-compatible /audio/transcriptions endpoint
const recognizeOpenai = async (audioBuffer: Buffer): Promise<string> => {
  const formData = new FormData();
  formData.append("file", audioBuffer, "audio.ogg");
  formData.append("model", env("OPENAI_STT_MODEL") ?? "whisper-1");

  const response = await axios.post(
    `${getOpenaiSpeechBase()}/audio/transcriptions`,
    formData,
    { headers: getOpenaiSpeechHeaders() }
  );

  return response.data.text;
};

export const recognize = async (audioBuffer: Buffer): Promise<string> => {
  const maxVolume = await getPeakVolume(audioBuffer);
  if (maxVolume < WHISPER_MIN_DB) {
    throw new NoRecognitionError();
  }

  switch (resolveSpeechProvider()) {
  case "openai":
    return recognizeOpenai(audioBuffer);
  case "azure":
    return recognizeGroq(audioBuffer);
  }
};
