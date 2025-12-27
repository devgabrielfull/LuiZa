#!/usr/bin/env python3
import sys
from pytubefix import YouTube
from pydub import AudioSegment
import os

def download_audio(video_url, output_file):
    try:
        print(f"�� Conectando ao YouTube: {video_url}")
        yt = YouTube(video_url)
        print(f"📹 Título: {yt.title}")
        print(f"⏱️ Duração: {yt.length}s")
        audio_stream = yt.streams.filter(only_audio=True).first()
        if not audio_stream:
            print("❌ Nenhum stream de áudio encontrado")
            sys.exit(1)
        print(f"📥 Baixando áudio...")
        temp_file = audio_stream.download(filename="temp_audio")
        print(f"🔄 Convertendo para MP3...")
        audio = AudioSegment.from_file(temp_file)
        audio.export(output_file, format="mp3", bitrate="128k")
        os.remove(temp_file)
        print(f"✅ Áudio salvo em: {output_file}")
    except Exception as e:
        print(f"❌ Erro: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python3 download_audio.py <video_url> <output_file>")
        sys.exit(1)
    video_url = sys.argv[1]
    output_file = sys.argv[2]
    download_audio(video_url, output_file)
