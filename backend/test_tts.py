import asyncio
import edge_tts

async def test():
    tests = [
        ("藏_original", "藏"),
        ("藏_bopo", "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-TW'><voice name='zh-TW-HsiaoChenNeural'><phoneme alphabet='bopomofo' ph='ㄘㄤˊ'>藏</phoneme></voice></speak>"),
        ("藏_pinyin", "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-TW'><voice name='zh-TW-HsiaoChenNeural'><phoneme alphabet='pinyin' ph='cang2'>藏</phoneme></voice></speak>"),
        ("藏_sapi", "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-TW'><voice name='zh-TW-HsiaoChenNeural'><phoneme alphabet='sapi' ph='c a ng 2'>藏</phoneme></voice></speak>"),
        ("鑶", "鑶"),
        ("匨", "匨")
    ]
    
    for name, text in tests:
        try:
            if text.startswith("<speak"):
                # Mock edge_tts to send SSML directly
                class CustomCommunicate(edge_tts.Communicate):
                    def _mkssml(self) -> str:
                        return self.text
                comm = CustomCommunicate(text, "zh-TW-HsiaoChenNeural")
            else:
                comm = edge_tts.Communicate(text, "zh-TW-HsiaoChenNeural")
                
            await comm.save(f"{name}.mp3")
            print(f"✅ Success: {name}")
        except Exception as e:
            print(f"❌ Failed: {name} - {str(e)}")

asyncio.run(test())
