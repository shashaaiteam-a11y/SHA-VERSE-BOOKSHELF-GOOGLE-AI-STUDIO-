import { useState, useRef } from "react";
import { Upload, Image, FileText, X, Check, ChevronsUpDown, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useBooks } from "@/hooks/useBooks";
import { BOOK_CATEGORIES } from "@/lib/constants/bookshelf";
import { WORLD_LANGUAGES } from "@/lib/constants/languages";

interface UploadBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
}

const UploadBookDialog = ({
  open,
  onOpenChange,
  channelId,
}: UploadBookDialogProps) => {
  const { uploadBook } = useBooks();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState("");
  const [category, setCategory] = useState<string>(BOOK_CATEGORIES[0]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [language, setLanguage] = useState<string>("English");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleBookSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBookFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!title || !author || !channelId) return;

    await uploadBook.mutateAsync({
      title,
      author,
      description,
      category,
      language,
      coverFile: coverFile || undefined,
      bookFile: bookFile || undefined,
      pages: pages ? parseInt(pages) : undefined,
      channelId,
    });

    // Reset form
    setTitle("");
    setAuthor("");
    setDescription("");
    setPages("");
    setCategory(BOOK_CATEGORIES[0]);
    setLanguage("English");
    setCoverFile(null);
    setBookFile(null);
    setCoverPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="fixed inset-0 z-[100] w-full h-full max-w-none max-h-none p-0 bg-background text-foreground border-none rounded-none flex flex-col overflow-hidden !translate-x-0 !translate-y-0 !left-0 !top-0 opacity-100 shadow-none"
      >
        {/* Full Screen Header Bar */}
        <div className="shrink-0 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              Upload Book
            </DialogTitle>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto w-full space-y-5 scrollbar-hide">
          {/* Cover Image */}
          <div>
            <Label>Cover Image</Label>
            <div
              onClick={() => coverInputRef.current?.click()}
              className="mt-2 aspect-[2/3] max-h-[200px] w-auto mx-auto rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center overflow-hidden"
            >
              {coverPreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload cover
                  </p>
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverSelect}
            />
          </div>

          {/* Book File */}
          <div>
            <Label>Book File (PDF, EPUB)</Label>
            <div
              onClick={() => bookInputRef.current?.click()}
              className="mt-2 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer"
            >
              {bookFile ? (
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{bookFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(bookFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload book file
                  </p>
                </div>
              )}
            </div>
            <input
              ref={bookInputRef}
              type="file"
              accept=".pdf,.epub,.mobi"
              className="hidden"
              onChange={handleBookSelect}
            />
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              className="mt-1"
            />
          </div>

          {/* Author */}
          <div>
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              className="mt-1"
            />
          </div>

          {/* Category — searchable, scrollable combobox (replaces native Select to fix click-through inside scrollable dialog) */}
          <div>
            <Label>Category *</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full justify-between font-normal mt-1"
                >
                  {category}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0 z-[100]"
                align="start"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandList className="max-h-[240px] overflow-y-auto overscroll-contain">
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {BOOK_CATEGORIES.map((cat) => (
                        <CommandItem
                          key={cat}
                          value={cat}
                          onSelect={() => {
                            setCategory(cat);
                            setCategoryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              category === cat ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cat}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Language — searchable, scrollable combobox */}
          <div>
            <Label>Language *</Label>
            <Popover open={languageOpen} onOpenChange={setLanguageOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={languageOpen}
                  className="w-full justify-between font-normal mt-1"
                >
                  {language}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0 z-[100]"
                align="start"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <Command>
                  <CommandInput placeholder="Search languages..." />
                  <CommandList className="max-h-[240px] overflow-y-auto overscroll-contain">
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup>
                      {WORLD_LANGUAGES.map((lang) => (
                        <CommandItem
                          key={lang}
                          value={lang}
                          onSelect={() => {
                            setLanguage(lang);
                            setLanguageOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              language === lang ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {lang}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter book description"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Pages */}
          <div>
            <Label htmlFor="pages">Number of Pages</Label>
            <Input
              id="pages"
              type="number"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="e.g., 250"
              className="mt-1"
            />
          </div>

        </div>

        {/* Fixed Footer Bar */}
        <div className="shrink-0 p-4 sm:p-6 border-t border-border bg-background/95 backdrop-blur z-30">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1 py-3 sm:py-3.5 rounded-xl font-bold"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 py-3 sm:py-3.5 rounded-xl font-bold"
              onClick={handleSubmit}
              disabled={!title || !author || uploadBook.isPending}
            >
              {uploadBook.isPending ? "Uploading..." : "Upload Book"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadBookDialog;
