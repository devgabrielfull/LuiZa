Minha extensão que transcreve meus vídeos do Youtube com apenas 1 clique. 

A Estrutura é: [YouTube] → [Extensão Chrome] → [Backend Node.js :3333] → [yt-dlp + ffmpeg] → [Whisper API] → [Transcrição] 

Usuário abre um vídeo no YouTube e clica em "Transcrever Vídeo" - A extensão envia a URL para o backend local - O backend baixa o áudio com yt-dlp e converte para .mp3 com ffmpeg -  O áudio é enviado para a API Whisper da OpenAI -  A transcrição volta para a extensão com timestamps por segmento - Separei por extension e backend... 

Obs: .env e apps estão guardados localment


