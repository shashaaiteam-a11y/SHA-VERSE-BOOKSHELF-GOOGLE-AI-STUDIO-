import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Book,
  Plus,
  Search,
  TrendingUp,
  Flame,
  Users,
  Eye,
  MessageCircle,
  ThumbsUp,
  Grid,
  List,
  BookOpen,
  User,
  LogOut,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBooks } from "@/hooks/useBooks";
import { useChannels } from "@/hooks/useChannels";
import {
  useSubscribedBooks,
  useSubscribedBookChannels,
  getWeeklyDateRange,
} from "@/hooks/useBookFeeds";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UploadBookDialog from "@/components/bookshelf/UploadBookDialog";
import CreateAuthorChannelDialog from "@/components/bookshelf/CreateAuthorChannelDialog";
import BookCard from "@/components/bookshelf/BookCard";
import AppLogoStatusRing from "@/components/promotions/AppLogoStatusRing";
import { formatDistanceToNow } from "date-fns";
import { BOOK_CATEGORIES } from "@/lib/constants/bookshelf";

const Bookshelf = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("discover");
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
  const [warningExpanded, setWarningExpanded] = useState(true);

  // Filter for Subscribed tab by author channel
  const [selectedSubscribedAuthor, setSelectedSubscribedAuthor] = useState<string>("all");

  // Filter for Library tab reading progress status
  const [readingFilter, setReadingFilter] = useState<"all" | "in-progress" | "completed">("all");

  // 1. Discover Feed & Weekly Trending Feed
  const { books, trendingBooks, isLoading } = useBooks({
    page,
    limit: 20,
    search: searchQuery,
    category: selectedCategory,
  });

  // Discover Books: strictly sorted in chronological launch order (most recent launch first):
  // "JO RECENT LAUNCH HUI HAI WO SABSE PEHLE SHOW HONI CHAHIYE PHIR USKE BAAD PHIR USKE BAAD"
  const sortedDiscoverBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [books]);

  // Weekly Trending Books: strictly sorted by highest views and likes first:
  // "JISME SABSE ZYADA VEIWS, LIKES, HAIN WO SABSE PEHLE PHIR USKE BAAD PHIR USKE BAAD"
  const sortedTrendingBooks = useMemo(() => {
    return [...trendingBooks].sort((a, b) => {
      const scoreA = (a.views_count || 0) + (a.likes_count || 0);
      const scoreB = (b.views_count || 0) + (b.likes_count || 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      if ((b.views_count || 0) !== (a.views_count || 0)) {
        return (b.views_count || 0) - (a.views_count || 0);
      }
      return (b.likes_count || 0) - (a.likes_count || 0);
    });
  }, [trendingBooks]);

  const { channels } = useChannels("books");
  const userChannel = channels?.find((c) => c.user_id === user?.id);

  // 2. Subscribed Books (Exclusively from subscribed authors)
  const { data: subscribedBooks = [] } = useSubscribedBooks({
    search: searchQuery,
    category: selectedCategory,
    page: activeTab === "subscribed" ? page : 0,
    limit: 30,
  });

  const { data: subscribedChannels = [] } = useSubscribedBookChannels();

  const filteredSubscribedBooks = useMemo(() => {
    if (selectedSubscribedAuthor === "all") return subscribedBooks;
    return subscribedBooks.filter((b: any) => b.channel_id === selectedSubscribedAuthor);
  }, [subscribedBooks, selectedSubscribedAuthor]);

  // 3. Library: Books currently in Reading Progress (Server-side tracking)
  const { data: readingHistory = [] } = useQuery({
    queryKey: ["reading-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await (supabase as any)
        .from("book_reading_progress")
        .select(`
          id, current_page, total_pages, completed, last_read_at,
          book:books(*, channel:channels!books_channel_id_fkey(id, name, avatar_url, user_id))
        `)
        .eq("user_id", user.id)
        .order("last_read_at", { ascending: false })
        .limit(100);

      return (data || []).filter((item: any) => item.book && item.book.id);
    },
    enabled: !!user?.id,
  });

  // Filter reading progress books by progress status, search query, and category
  const inProgressBooks = useMemo(() => {
    return readingHistory.filter((item: any) => {
      if (!item.book) return false;
      const total = item.total_pages || item.book.pages || 100;
      const current = item.current_page || 1;
      const isComplete = item.completed || current >= total;

      if (readingFilter === "in-progress" && isComplete) return false;
      if (readingFilter === "completed" && !isComplete) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.book.title?.toLowerCase().includes(q);
        const matchesAuthor = item.book.author?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor) return false;
      }
      if (selectedCategory && selectedCategory !== "All") {
        if (item.book.category !== selectedCategory) return false;
      }
      return true;
    });
  }, [readingHistory, readingFilter, searchQuery, selectedCategory]);

  const categories = [
    { name: "All", icon: Grid },
    ...BOOK_CATEGORIES.map((cat) => ({ name: cat, icon: Book })),
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(0);
  };

  const renderPagination = (itemsCount: number) => {
    if (itemsCount === 0 && page === 0) return null;

    return (
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={itemsCount < 20}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AppLogoStatusRing />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Bookshelf
              </h1>
            </div>

            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search books, authors, or genres..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {userChannel && (
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  size="icon"
                  variant="ghost"
                  className="rounded-full w-9 h-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Upload Book"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none focus:outline-none cursor-pointer flex items-center justify-center p-0.5 rounded-full hover:opacity-85 transition-opacity">
                    <Avatar className="w-9 h-9 border border-border/80 shadow-xs">
                      <AvatarImage
                        src={userChannel?.avatar_url || user?.user_metadata?.avatar_url || ""}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {(userChannel?.name || user?.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50">
                  <DropdownMenuItem
                    onClick={() => {
                      if (userChannel) {
                        navigate(`/bookshelf/channel/${userChannel.id}`);
                      } else {
                        setShowCreateChannelDialog(true);
                      }
                    }}
                    className="gap-2.5 cursor-pointer py-2 font-medium"
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span>Your Channel</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate("/auth");
                    }}
                    className="gap-2.5 cursor-pointer py-2 text-destructive focus:text-destructive font-medium"
                  >
                    <LogOut className="w-4 h-4 text-destructive" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                  {(user?.email ||
                    user?.phone ||
                    user?.user_metadata?.email ||
                    user?.user_metadata?.phone_number ||
                    user?.user_metadata?.phone) && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-3 py-2 text-xs select-text bg-muted/40 rounded-b-md space-y-1">
                        {(user?.email || user?.user_metadata?.email) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" />
                            <span
                              className="text-[11px] font-medium text-foreground truncate break-all"
                              title={user?.email || user?.user_metadata?.email}
                            >
                              {user?.email || user?.user_metadata?.email}
                            </span>
                          </div>
                        )}
                        {(user?.phone ||
                          user?.user_metadata?.phone_number ||
                          user?.user_metadata?.phone) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" />
                            <span
                              className="text-[11px] font-medium text-foreground truncate break-all"
                              title={
                                user?.phone ||
                                user?.user_metadata?.phone_number ||
                                user?.user_metadata?.phone
                              }
                            >
                              {user?.phone ||
                                user?.user_metadata?.phone_number ||
                                user?.user_metadata?.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Copyright Warning Banner (Collapsible) */}
        <div className="mb-4 rounded-2xl border border-rose-300 dark:border-rose-800/80 bg-rose-50/90 dark:bg-rose-950/40 p-3.5 sm:p-4 shadow-2xs transition-all duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 fill-amber-500/20 shrink-0" />
              <h3 className="font-bold text-rose-600 dark:text-rose-400 text-sm sm:text-base tracking-tight">
                Copyright Warning
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setWarningExpanded(!warningExpanded)}
              className="w-7 h-7 rounded-full bg-rose-200/70 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              aria-label="Toggle Copyright Warning"
            >
              {warningExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {warningExpanded && (
            <p className="mt-2 text-xs sm:text-sm text-rose-900/90 dark:text-rose-200/90 leading-relaxed font-medium">
              Uploading or sharing copyrighted books without proper authorization is strictly prohibited on{" "}
              <strong className="font-bold text-rose-950 dark:text-rose-100">SHA-VERSE: BOOKSHELF</strong>. Any violation may result in immediate permanent suspension of the account and legal action in accordance with the copyright laws and regulations applicable in the user&apos;s respective country.
            </p>
          )}
        </div>

        {/* Category Filter Pills (Applicable across all tabs) */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
          {categories.map((cat) => (
            <Button
              key={cat.name}
              variant={selectedCategory === cat.name ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => {
                setSelectedCategory(cat.name);
                setPage(0);
              }}
            >
              <cat.icon className="w-4 h-4 mr-1" />
              {cat.name}
            </Button>
          ))}
        </div>

        {/* 4 Tabs Container */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="subscribed">Subscribed</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
          </TabsList>

          {/* ========================================================= */}
          {/* TAB 1: DISCOVER (Sabhi tarah ki books across all genres) */}
          {/* ========================================================= */}
          <TabsContent value="discover" className="space-y-6">
            {/* Explore All Books Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Book className="w-5 h-5 text-primary" />
                      Explore All Books
                    </h2>
                    <Badge variant="secondary" className="text-[10px] text-primary bg-primary/10">
                      Recent Launch First
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Browse all books across all categories — newest releases shown first
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-accent" : ""}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-accent" : ""}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 sm:gap-3">
                  {sortedDiscoverBooks.map((book) => (
                    <div key={book.id} className="w-[130px] sm:w-[150px] justify-self-center">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedDiscoverBooks.map((book) => (
                    <Card
                      key={book.id}
                      className="p-4 flex gap-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/bookshelf/book/${book.id}`)}
                    >
                      <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-primary">
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Book className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold line-clamp-1">{book.title}</h3>
                          {book.category && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {book.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          <span>{book.author}</span>
                          {book.created_at && (
                            <>
                              <span>•</span>
                              <span className="text-xs text-primary font-medium">
                                Launched {formatDistanceToNow(new Date(book.created_at), { addSuffix: true })}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {book.description || "No description provided."}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {book.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {book.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {book.comments_count || 0}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 sm:gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden animate-pulse">
                      <div className="aspect-[2/3] bg-muted" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoading && books.length === 0 && (
                <Card className="p-8 text-center">
                  <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No books found</h3>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery
                      ? "Try a different search term or category"
                      : "Be the first to upload a book in this category!"}
                  </p>
                </Card>
              )}

              {renderPagination(books.length)}
            </section>

            {/* Weekly Trending Preview Section */}
            {trendingBooks.length > 0 && (
              <section className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                    <h2 className="text-base font-semibold">Trending This Week</h2>
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:border-amber-800">
                      Updated Weekly
                    </Badge>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setActiveTab("trending")}
                    className="text-xs text-primary cursor-pointer"
                  >
                    View Weekly Charts &rarr;
                  </Button>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 sm:gap-3">
                  {trendingBooks.slice(0, 6).map((book) => (
                    <div key={book.id} className="w-[130px] sm:w-[150px] justify-self-center">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Authors Section */}
            <section className="pt-2 border-t border-border/60">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Featured Author Channels
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {channels?.slice(0, 6).map((channel) => (
                  <Card
                    key={channel.id}
                    className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/bookshelf/channel/${channel.id}`)}
                  >
                    <Avatar className="w-16 h-16 mx-auto mb-2">
                      <AvatarImage src={channel.avatar_url || ""} />
                      <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-sm line-clamp-1">{channel.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {channel.subscribers_count || 0} subscribers
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Author
                    </Badge>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 2: TRENDING (Weekly Trending Books & Ranks) */}
          {/* ========================================================= */}
          <TabsContent value="trending" className="space-y-5">
            {/* Weekly Trending Header Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/10 border border-amber-300/40 dark:border-amber-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                  <Flame className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold">Weekly Trending Books</h2>
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-[11px] px-2 py-0.5">
                      Auto-Updated Weekly
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Highest Views & Likes first • Auto-updates every week • Week of {getWeeklyDateRange()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-accent" : ""}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-accent" : ""}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {sortedTrendingBooks.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 sm:gap-3">
                  {sortedTrendingBooks.map((book, idx) => (
                    <div key={book.id} className="relative w-[130px] sm:w-[150px] justify-self-center group flex flex-col">
                      {/* Weekly Rank Badge */}
                      <div
                        className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${
                          idx === 0
                            ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300"
                            : idx === 1
                            ? "bg-slate-300 text-slate-900 ring-2 ring-slate-200"
                            : idx === 2
                            ? "bg-amber-700 text-white ring-2 ring-amber-600"
                            : "bg-black/75 text-white backdrop-blur-xs"
                        }`}
                      >
                        #{idx + 1}
                      </div>
                      <BookCard book={book} />
                      {/* Views & Likes pill under card */}
                      <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5 font-medium text-foreground">
                          <Eye className="w-3 h-3 text-primary" />
                          {book.views_count || 0}
                        </span>
                        <span className="flex items-center gap-0.5 font-medium text-rose-500">
                          <ThumbsUp className="w-3 h-3" />
                          {book.likes_count || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedTrendingBooks.map((book, idx) => (
                    <Card
                      key={book.id}
                      className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer relative"
                      onClick={() => navigate(`/bookshelf/book/${book.id}`)}
                    >
                      {/* Rank Number */}
                      <div className="w-8 text-center shrink-0">
                        <span
                          className={`text-lg font-black ${
                            idx === 0
                              ? "text-amber-500"
                              : idx === 1
                              ? "text-slate-400"
                              : idx === 2
                              ? "text-amber-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-primary">
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Book className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{book.title}</h3>
                          {book.category && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {book.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{book.author}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {book.description || "No description provided."}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-semibold text-primary">
                            <Eye className="w-3.5 h-3.5" />
                            {book.views_count || 0} views
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-rose-500">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {book.likes_count || 0} likes
                          </span>
                          {book.rating_avg ? (
                            <span className="flex items-center gap-1 text-amber-500 font-medium">
                              ★ {book.rating_avg.toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <Card className="p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No trending books in this category this week</h3>
                <p className="text-muted-foreground text-sm">
                  Try selecting "All" or a different category to see this week's charts.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 3: SUBSCRIBED (Sirf Subscribed Books) */}
          {/* ========================================================= */}
          <TabsContent value="subscribed" className="space-y-4">
            {!user ? (
              <Card className="p-8 text-center max-w-md mx-auto">
                <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Sign in to view Subscribed Books</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Subscribe to your favorite author channels to see all of their new books right here.
                </p>
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              </Card>
            ) : subscribedBooks.length > 0 ? (
              <>
                {/* Subscribed Authors Quick Filter Bar */}
                {subscribedChannels.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                      size="sm"
                      variant={selectedSubscribedAuthor === "all" ? "default" : "outline"}
                      onClick={() => setSelectedSubscribedAuthor("all")}
                      className="text-xs shrink-0"
                    >
                      All Authors ({subscribedBooks.length})
                    </Button>
                    {subscribedChannels.map((channel: any) => (
                      <Button
                        key={channel.id}
                        size="sm"
                        variant={selectedSubscribedAuthor === channel.id ? "default" : "outline"}
                        onClick={() => setSelectedSubscribedAuthor(channel.id)}
                        className="text-xs shrink-0 flex items-center gap-1.5"
                      >
                        <Avatar className="w-4 h-4">
                          <AvatarImage src={channel.avatar_url || ""} />
                          <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{channel.name}</span>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Exclusively Subscribed Books Grid */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 sm:gap-3">
                  {filteredSubscribedBooks.map((book: any) => (
                    <div key={book.id} className="w-[130px] sm:w-[150px] justify-self-center">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
                {renderPagination(filteredSubscribedBooks.length)}
              </>
            ) : (
              <Card className="p-8 text-center max-w-md mx-auto">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Subscribed Books Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Only books from authors you subscribe to will appear in this tab. Explore authors in the Discover tab and click Subscribe to follow them!
                </p>
                <Button onClick={() => setActiveTab("discover")}>
                  Discover Authors
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 4: LIBRARY (Sirf Reading Progress Books) */}
          {/* ========================================================= */}
          <TabsContent value="library" className="space-y-4">
            {/* Reading Progress Header & Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Reading In Progress ({inProgressBooks.length})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Books currently in your reading progress. Resume reading right where you stopped.
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Progress Filter Pills */}
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setReadingFilter("all")}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      readingFilter === "all"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({readingHistory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadingFilter("in-progress")}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      readingFilter === "in-progress"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadingFilter("completed")}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      readingFilter === "completed"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Finished
                  </button>
                </div>

                <div className="flex items-center gap-1 border-l border-border pl-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-accent" : ""}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-accent" : ""}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {!user ? (
              <Card className="p-8 text-center max-w-md mx-auto">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Sign in to track your Reading Progress</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Your reading positions, bookmarks, and page progress are securely synced across all your devices.
                </p>
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              </Card>
            ) : inProgressBooks.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3 sm:gap-4">
                  {inProgressBooks.map((item: any) => {
                    const total = item.total_pages || item.book.pages || 100;
                    const current = Math.min(item.current_page || 1, total);
                    const pct = Math.min(100, Math.round((current / total) * 100));
                    const isComplete = item.completed || pct >= 100;

                    return (
                      <Card
                        key={item.id}
                        className="group overflow-hidden flex flex-col hover:shadow-lg transition-all border border-border/80 cursor-pointer bg-card"
                        onClick={() => navigate(`/bookshelf/read/${item.book.id}`)}
                      >
                        <div className="relative aspect-[2/3] w-full bg-muted overflow-hidden">
                          {item.book.cover_url ? (
                            <img
                              src={item.book.cover_url}
                              alt={item.book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
                              <Book className="w-10 h-10 text-white/80" />
                            </div>
                          )}

                          {/* Progress bar overlay at bottom of cover */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-6 text-white">
                            <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                              <span>{pct}% read</span>
                              <span>
                                Page {current}/{total}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isComplete ? "bg-emerald-400" : "bg-primary"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {isComplete && (
                            <Badge className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold shadow-md">
                              Finished
                            </Badge>
                          )}
                        </div>

                        <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                          <div>
                            <h3
                              className="font-semibold text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors"
                              title={item.book.title}
                            >
                              {item.book.title}
                            </h3>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {item.book.author}
                            </p>
                          </div>

                          <div className="pt-1.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="truncate">
                              {item.last_read_at
                                ? formatDistanceToNow(new Date(item.last_read_at), {
                                    addSuffix: true,
                                  })
                                : "Recently"}
                            </span>
                            <span className="text-primary font-semibold flex items-center gap-0.5">
                              Resume &rarr;
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {inProgressBooks.map((item: any) => {
                    const total = item.total_pages || item.book.pages || 100;
                    const current = Math.min(item.current_page || 1, total);
                    const pct = Math.min(100, Math.round((current / total) * 100));
                    const isComplete = item.completed || pct >= 100;

                    return (
                      <Card
                        key={item.id}
                        className="p-3 sm:p-4 flex gap-3 sm:gap-4 hover:shadow-md transition-all cursor-pointer border border-border/80 group"
                        onClick={() => navigate(`/bookshelf/read/${item.book.id}`)}
                      >
                        <div className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted relative">
                          {item.book.cover_url ? (
                            <img
                              src={item.book.cover_url}
                              alt={item.book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
                              <Book className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
                                {item.book.title}
                              </h3>
                              {item.book.category && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {item.book.category}
                                </Badge>
                              )}
                              {isComplete && (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                  Finished
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.book.author}
                            </p>
                          </div>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Page {current} of {total}
                              </span>
                              <span className="font-semibold text-primary">{pct}% completed</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isComplete ? "bg-emerald-500" : "bg-primary"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground pt-0.5">
                              Last read{" "}
                              {item.last_read_at
                                ? formatDistanceToNow(new Date(item.last_read_at), {
                                    addSuffix: true,
                                  })
                                : "recently"}
                            </p>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center">
                          <Button size="sm" className="gap-1.5 cursor-pointer">
                            <BookOpen className="w-4 h-4" />
                            Continue
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : (
              <Card className="p-8 text-center max-w-md mx-auto">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Books In Reading Progress</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {readingFilter !== "all"
                    ? "No books match this status filter. Switch to 'All' to see all your reading history."
                    : "Start reading any book from the Discover tab and it will appear here automatically with your saved page progress."}
                </p>
                <Button onClick={() => setActiveTab("discover")}>
                  Explore Books
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <UploadBookDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        channelId={userChannel?.id || ""}
      />

      <CreateAuthorChannelDialog
        open={showCreateChannelDialog}
        onOpenChange={setShowCreateChannelDialog}
      />
    </div>
  );
};

export default Bookshelf;
