import { Globe, Volume2, Sparkles, Languages, Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SUPPORTED_LANGUAGES, TTS_VOICES } from "@/hooks/useReaderAI";
import { cn } from "@/lib/utils";

interface Props {
  targetLanguage: string;
  onLanguageChange: (lang: string) => void;
  isTranslating: boolean;
  isPlaying: boolean;
  isGeneratingAudio: boolean;
  onStopAudio: () => void;
  currentVoice?: string;
  onVoiceChange?: (voice: string) => void;
}

const ReaderAIPanel = ({
  targetLanguage,
  onLanguageChange,
  isTranslating,
  isPlaying,
  isGeneratingAudio,
  onStopAudio,
}: Props) => {
  return (
    <div className="space-y-6 py-4">
      {/* Translation Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm">AI Translation</h3>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Target Language</p>
          <Select value={targetLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-full h-11 rounded-xl">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="original" className="font-bold">Original (No Translation)</SelectItem>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isTranslating && (
          <div className="flex items-center gap-2 text-xs text-primary font-medium animate-pulse">
            <Sparkles className="w-3 h-3" />
            <span>AI is translating the book in the background...</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Audiobook Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm">Audiobook Engine</h3>
        </div>

        <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Playback Control</p>
              <p className="text-[11px] text-muted-foreground">Tap a paragraph to start listening</p>
            </div>
            {isPlaying && (
              <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full" onClick={onStopAudio}>
                {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Narrator Voice</p>
          <div className="grid grid-cols-2 gap-2">
            {TTS_VOICES.map((voice) => (
              <Button
                key={voice.id}
                variant="outline"
                className="h-auto py-2.5 px-3 flex flex-col items-start gap-0.5 rounded-xl text-left"
              >
                <span className="text-[11px] font-bold">{voice.name}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{voice.gender}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <p className="text-[10px] text-muted-foreground leading-relaxed text-center italic">
          Translation and speech generation are powered by advanced AI models. 
          Longer books may take a moment to process.
        </p>
      </div>
    </div>
  );
};

export default ReaderAIPanel;
