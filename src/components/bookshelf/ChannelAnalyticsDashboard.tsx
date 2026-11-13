import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useChannelAnalytics,
  AnalyticsTimeRange,
  BookAnalyticsData,
} from "@/hooks/useBookshelfAnalytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Book,
  Eye,
  ThumbsUp,
  Download,
  MessageCircle,
  Share2,
  Bookmark,
  Users,
  Clock,
  TrendingUp,
  Search,
  ArrowUpDown,
  BarChart3,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import BookAnalyticsModal from "./BookAnalyticsModal";
import { formatDistanceToNow } from "date-fns";

interface Props {
  channelId: string;
}

type SortField =
  | "views"
  | "downloads"
  | "likes"
  | "comments"
  | "shares"
  | "bookmarks"
  | "readingTime"
  | "recent"
  | "oldest";

export const ChannelAnalyticsDashboard: React.FC<Props> = ({ channelId }) => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("28d");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("views");
  const [selectedBookForAnalytics, setSelectedBookForAnalytics] = useState<string | null>(null);

  const { data: analytics, isLoading, refetch, isFetching } = useChannelAnalytics(
    channelId,
    timeRange
  );

  // Time Range Options
  const timeRanges: { id: AnalyticsTimeRange; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7d", label: "Last 7 Days" },
    { id: "28d", label: "Last 28 Days" },
    { id: "90d", label: "Last 90 Days" },
    { id: "365d", label: "Last 365 Days" },
    { id: "all", label: "All Time" },
  ];

  // Filter and sort individual book performance
  const sortedBooks = useMemo(() => {
    if (!analytics?.books) return [];

    let list = [...analytics.books];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.book.title.toLowerCase().includes(q) ||
          item.book.author.toLowerCase().includes(q) ||
          (item.book.category && item.book.category.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "views":
          return b.totalViews - a.totalViews;
        case "downloads":
          return b.totalDownloads - a.totalDownloads;
        case "likes":
          return b.totalLikes - a.totalLikes;
        case "comments":
          return b.totalComments - a.totalComments;
        case "shares":
          return b.totalShares - a.totalShares;
        case "bookmarks":
          return b.totalBookmarks - a.totalBookmarks;
        case "readingTime":
          return b.totalReadingTimeMinutes - a.totalReadingTimeMinutes;
        case "recent":
          return (
            new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime()
          );
        default:
          return b.totalViews - a.totalViews;
      }
    });

    return list;
  }, [analytics?.books, searchQuery, sortBy]);

  if (isLoading && !analytics) {
    return (
      <div className="p-8 text-center space-y-4">
        <Activity className="w-8 h-8 mx-auto animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading Real-Time Channel Analytics...
        </p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold text-lg mb-1">No Channel Data Found</h3>
        <p className="text-xs text-muted-foreground">
          Upload books to this channel to begin collecting real-time statistics.
        </p>
      </Card>
    );
  }

  // Format hours and minutes
  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header & Live 3-Second Sync Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-primary/30 shadow-xs">
            <AvatarImage src={analytics.avatarUrl || ""} />
            <AvatarFallback className="font-bold bg-primary/10 text-primary">
              {analytics.channelName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight">{analytics.channelName}</h2>
              <Badge className="bg-primary/90 text-white text-[11px] font-semibold">
                Channel Analytics
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aggregated across {analytics.totalBooks} published {analytics.totalBooks === 1 ? "book" : "books"} • {analytics.totalSubscribers.toLocaleString()} subscribers
            </p>
          </div>
        </div>

        {/* Live Status Pill & Refresh button */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold select-none shadow-2xs"
            title="Real-Time automatic synchronization active (maximum 3-second cycle)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>Live • 3s Sync</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 cursor-pointer"
            title="Force refresh analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* Time Range Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {timeRanges.map((range) => (
          <Button
            key={range.id}
            size="sm"
            variant={timeRange === range.id ? "default" : "outline"}
            onClick={() => setTimeRange(range.id)}
            className="text-xs shrink-0 rounded-full cursor-pointer transition-all"
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Primary KPI Overview Cards (YouTube Studio Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Views */}
        <Card className="p-3.5 sm:p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Total Views</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {analytics.totalViews.toLocaleString()}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            Sum of all books
          </p>
        </Card>

        {/* Total Downloads */}
        <Card className="p-3.5 sm:p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Downloads</span>
            <Download className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {analytics.totalDownloads.toLocaleString()}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Verified files</p>
        </Card>

        {/* Total Likes */}
        <Card className="p-3.5 sm:p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Total Likes</span>
            <ThumbsUp className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {analytics.totalLikes.toLocaleString()}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Reader upvotes</p>
        </Card>

        {/* Total Comments */}
        <Card className="p-3.5 sm:p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Comments</span>
            <MessageCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {analytics.totalComments.toLocaleString()}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Community reviews</p>
        </Card>

        {/* Reading Time */}
        <Card className="p-3.5 sm:p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Reading Time</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {formatReadingTime(analytics.totalReadingTimeMinutes)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {analytics.totalReadingSessions} sessions
          </p>
        </Card>

        {/* Subscribers / Readers */}
        <Card className="p-3.5 sm:p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Subscribers</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {analytics.totalSubscribers.toLocaleString()}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {analytics.uniqueReaders} unique readers
          </p>
        </Card>
      </div>

      {/* Visual Analytics Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Views & Downloads Area Chart */}
        <Card className="p-4 sm:p-5 bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Views & Downloads Over Time
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Channel-wide reader activity for selected period
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {timeRange.toUpperCase()}
            </Badge>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.timeline}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="downloadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.85)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#viewsGrad)"
                  name="Views"
                />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#downloadsGrad)"
                  name="Downloads"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Likes, Comments & Engagement Bar Chart */}
        <Card className="p-4 sm:p-5 bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-rose-500" />
                Likes & Reader Comments
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Community interaction & response metrics
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Engagements
            </Badge>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.timeline}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.85)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="likes" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Likes" />
                <Bar dataKey="comments" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Comments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Individual Book Performance Table / Cards */}
      <Card className="p-4 sm:p-6 bg-card border border-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Book className="w-5 h-5 text-primary" />
              Individual Book Performance ({sortedBooks.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Independent statistics for each book belonging to this channel
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search channel books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="bg-muted text-foreground border border-border rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
              >
                <option value="views">Most Viewed</option>
                <option value="downloads">Most Downloaded</option>
                <option value="likes">Most Liked</option>
                <option value="comments">Most Commented</option>
                <option value="shares">Most Shared</option>
                <option value="readingTime">Most Reading Time</option>
                <option value="recent">Recently Published</option>
                <option value="oldest">Oldest Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Books Performance Table */}
        {sortedBooks.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
                  <th className="py-2.5 px-3">Book</th>
                  <th className="py-2.5 px-3 text-right">Views</th>
                  <th className="py-2.5 px-3 text-right">Downloads</th>
                  <th className="py-2.5 px-3 text-right">Likes</th>
                  <th className="py-2.5 px-3 text-right">Comments</th>
                  <th className="py-2.5 px-3 text-right">Shares</th>
                  <th className="py-2.5 px-3 text-right">Bookmarks</th>
                  <th className="py-2.5 px-3 text-right">Reading Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {sortedBooks.map((item, idx) => (
                  <tr
                    key={item.book.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedBookForAnalytics(item.book.id)}
                  >
                    {/* Book Identity */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                          {idx + 1}
                        </span>
                        <div className="w-9 h-13 rounded overflow-hidden bg-muted shrink-0 shadow-2xs border border-border/60">
                          {item.book.cover_url ? (
                            <img
                              src={item.book.cover_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <Book className="w-4 h-4 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[200px] group-hover:text-primary transition-colors">
                            {item.book.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.book.category || "General"} •{" "}
                            {formatDistanceToNow(new Date(item.publicationDate), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {item.totalViews.toLocaleString()}
                    </td>

                    {/* Downloads */}
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {item.totalDownloads.toLocaleString()}
                    </td>

                    {/* Likes */}
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {item.totalLikes.toLocaleString()}
                    </td>

                    {/* Comments */}
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {item.totalComments.toLocaleString()}
                    </td>

                    {/* Shares */}
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {item.totalShares.toLocaleString()}
                    </td>

                    {/* Bookmarks */}
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {item.totalBookmarks.toLocaleString()}
                    </td>

                    {/* Reading Time */}
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {formatReadingTime(item.totalReadingTimeMinutes)}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBookForAnalytics(item.book.id);
                        }}
                        className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5 mr-1" />
                        <span>Analytics</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Book className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No books match your search or filter.</p>
          </div>
        )}
      </Card>

      {/* Individual Book Analytics Modal */}
      {selectedBookForAnalytics && (
        <BookAnalyticsModal
          bookId={selectedBookForAnalytics}
          open={!!selectedBookForAnalytics}
          onOpenChange={(open) => !open && setSelectedBookForAnalytics(null)}
        />
      )}
    </div>
  );
};

export default ChannelAnalyticsDashboard;
