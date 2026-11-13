import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  useBookAnalytics,
  AnalyticsTimeRange,
} from "@/hooks/useBookshelfAnalytics";
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
  BookOpen,
  Eye,
  ThumbsUp,
  Download,
  MessageCircle,
  Share2,
  Bookmark,
  Users,
  Clock,
  TrendingUp,
  Activity,
  RefreshCw,
  Calendar,
  Sparkles,
  BarChart3,
  Layers,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Props {
  bookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookAnalyticsModal: React.FC<Props> = ({
  bookId,
  open,
  onOpenChange,
}) => {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("28d");
  const { data: analytics, isLoading, refetch, isFetching } = useBookAnalytics(
    bookId,
    timeRange
  );

  const timeRanges: { id: AnalyticsTimeRange; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7d", label: "Last 7 Days" },
    { id: "28d", label: "Last 28 Days" },
    { id: "90d", label: "Last 90 Days" },
    { id: "365d", label: "Last 365 Days" },
    { id: "all", label: "All Time" },
  ];

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3 border-b border-border/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 rounded-md overflow-hidden bg-muted shrink-0 shadow-xs border border-border/80">
                {analytics?.book?.cover_url ? (
                  <img
                    src={analytics.book.cover_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                    {analytics?.book?.title || "Book Analytics"}
                  </DialogTitle>
                  <Badge variant="secondary" className="text-[11px] font-semibold">
                    Studio Analytics
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  by {analytics?.book?.author || "Author"} •{" "}
                  {analytics?.book?.category || "General"}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold select-none shadow-2xs"
                title="Real-time 3-second synchronization active"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>Live • 3s Sync</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="text-xs gap-1.5 cursor-pointer h-7"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
                />
                <span>Sync</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading && !analytics ? (
          <div className="p-12 text-center space-y-3">
            <Activity className="w-8 h-8 mx-auto animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-medium">
              Loading book statistics...
            </p>
          </div>
        ) : !analytics ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">Unable to load analytics for this book.</p>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Time Range Filter Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {timeRanges.map((range) => (
                <Button
                  key={range.id}
                  size="sm"
                  variant={timeRange === range.id ? "default" : "outline"}
                  onClick={() => setTimeRange(range.id)}
                  className="text-xs shrink-0 rounded-full cursor-pointer h-7"
                >
                  {range.label}
                </Button>
              ))}
            </div>

            {/* Complete 15 Core Metrics Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Key Performance Indicators (15 Metrics)
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  Real Database Values
                </Badge>
              </div>

              {/* Group 1: Traffic & Readers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Total Views */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Total Views</span>
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.totalViews.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#1 Metric</span>
                </Card>

                {/* 2. Unique Views */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Unique Views</span>
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.uniqueViews.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#2 Unique audience</span>
                </Card>

                {/* 12. Unique Readers */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Unique Readers</span>
                    <Users className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.uniqueReaders.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#12 Verified readers</span>
                </Card>

                {/* 5. Total Downloads */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Downloads</span>
                    <Download className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.totalDownloads.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#5 Offline saves</span>
                </Card>
              </div>

              {/* Group 2: Engagement & Social */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 3. Total Likes */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Total Likes</span>
                    <ThumbsUp className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.totalLikes.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#3 Reader likes</span>
                </Card>

                {/* 4. Total Comments */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Comments</span>
                    <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.totalComments.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#4 Discussions</span>
                </Card>

                {/* 6. Total Shares */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Shares</span>
                    <Share2 className="w-3.5 h-3.5 text-sky-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.totalShares.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#6 Social virality</span>
                </Card>

                {/* 7. Total Bookmarks */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Bookmarks</span>
                    <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.totalBookmarks.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#7 Saved to library</span>
                </Card>
              </div>

              {/* Group 3: Reading Behavior */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 8. Total Reading Sessions */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Reading Sessions</span>
                    <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.totalReadingSessions.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#8 Reader launches</span>
                </Card>

                {/* 9. Total Reading Time */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Total Reading Time</span>
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {formatReadingTime(analytics.totalReadingTimeMinutes)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#9 Total watch/read</span>
                </Card>

                {/* 10. Average Reading Duration */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Avg Duration</span>
                    <Clock className="w-3.5 h-3.5 text-teal-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.averageReadingDurationMinutes} min
                  </div>
                  <span className="text-[10px] text-muted-foreground">#10 Per session</span>
                </Card>

                {/* 11. Total Pages Read */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Pages Read</span>
                    <Layers className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {analytics.totalPagesRead.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">#11 Pages turned</span>
                </Card>
              </div>

              {/* Group 4: Metadata & Health */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 15. Engagement Rate */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Engagement Rate</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-primary">
                    {analytics.engagementRate}%
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    #15 Interactivity score
                  </span>
                </Card>

                {/* 14. Publication Date */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Publication Date</span>
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {format(new Date(analytics.publicationDate), "PPP")}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    #14 Published {formatDistanceToNow(new Date(analytics.publicationDate), { addSuffix: true })}
                  </span>
                </Card>

                {/* 13. Last Activity */}
                <Card className="p-3 bg-card border border-border/80">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Last Activity</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {analytics.lastActivityTimestamp
                      ? formatDistanceToNow(new Date(analytics.lastActivityTimestamp), {
                          addSuffix: true,
                        })
                      : "Recent"}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    #13 Latest reader interaction
                  </span>
                </Card>
              </div>
            </div>

            {/* Visual Analytics Charts (Recharts) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                Performance Trends Over Time
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Views & Downloads */}
                <Card className="p-4 bg-card border border-border shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold">Views & Downloads</span>
                    <Badge variant="outline" className="text-[10px]">
                      {timeRange.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.timeline}>
                        <defs>
                          <linearGradient id="bookViewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="bookDownloadsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.85)",
                            border: "none",
                            borderRadius: "6px",
                            color: "#fff",
                            fontSize: "11px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#bookViewsGrad)"
                          name="Views"
                        />
                        <Area
                          type="monotone"
                          dataKey="downloads"
                          stroke="#a855f7"
                          strokeWidth={2}
                          fill="url(#bookDownloadsGrad)"
                          name="Downloads"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Likes & Comments */}
                <Card className="p-4 bg-card border border-border shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold">Likes & Comments</span>
                    <Badge variant="outline" className="text-[10px]">
                      Interactions
                    </Badge>
                  </div>
                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.timeline}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.85)",
                            border: "none",
                            borderRadius: "6px",
                            color: "#fff",
                            fontSize: "11px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar
                          dataKey="likes"
                          fill="#f43f5e"
                          radius={[4, 4, 0, 0]}
                          name="Likes"
                        />
                        <Bar
                          dataKey="comments"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                          name="Comments"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookAnalyticsModal;
