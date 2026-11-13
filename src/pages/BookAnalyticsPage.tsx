import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useBookAnalytics,
  AnalyticsTimeRange,
} from "@/hooks/useBookshelfAnalytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
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

export const BookAnalyticsPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
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

  if (isLoading && !analytics) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Activity className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading Real-Time Book Analytics...
        </p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-60" />
          <h2 className="text-xl font-bold mb-2">Book Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Could not locate analytics data for this book.
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg truncate max-w-xs sm:max-w-md">
                  {analytics.book.title}
                </h1>
                <Badge variant="secondary" className="text-[10px]">
                  Analytics
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Channel: {analytics.book.channel?.name || "Bookshelf"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold select-none shadow-2xs"
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
              className="text-xs gap-1.5 cursor-pointer h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Book Overview Banner Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-xs">
          <div className="w-20 h-28 sm:w-24 sm:h-34 rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm border border-border">
            {analytics.book.cover_url ? (
              <img
                src={analytics.book.cover_url}
                alt={analytics.book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {analytics.book.title}
              </h2>
              <Badge className="bg-primary/90 text-white text-xs">
                YouTube-Style Studio
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Written by {analytics.book.author} • Category: {analytics.book.category || "General"}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Published {format(new Date(analytics.publicationDate), "PP")}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Last Read:{" "}
                {analytics.lastActivityTimestamp
                  ? formatDistanceToNow(new Date(analytics.lastActivityTimestamp), {
                      addSuffix: true,
                    })
                  : "Recently"}
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Engagement: {analytics.engagementRate}%
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => navigate(`/bookshelf/book/${bookId}`)}
              className="text-xs cursor-pointer"
            >
              Book Details
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/bookshelf/read/${bookId}`)}
              className="text-xs cursor-pointer"
            >
              Open Reader
            </Button>
          </div>
        </div>

        {/* Time Range Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {timeRanges.map((range) => (
            <Button
              key={range.id}
              size="sm"
              variant={timeRange === range.id ? "default" : "outline"}
              onClick={() => setTimeRange(range.id)}
              className="text-xs shrink-0 rounded-full cursor-pointer h-8"
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* 15 Metrics Dashboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              15 Individual Statistics (Database-Backed)
            </h3>
            <Badge variant="outline" className="text-xs">
              Live Real-Time
            </Badge>
          </div>

          {/* Group 1: Reach & Traffic */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Total Views</span>
                <Eye className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.totalViews.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">1. Total page visits</p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Unique Views</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.uniqueViews.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">2. Unique impressions</p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Unique Readers</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.uniqueReaders.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">12. Verified users</p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Total Downloads</span>
                <Download className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.totalDownloads.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">5. Offline copies</p>
            </Card>
          </div>

          {/* Group 2: Engagements */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Total Likes</span>
                <ThumbsUp className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.totalLikes.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">3. Reader upvotes</p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Total Comments</span>
                <MessageCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.totalComments.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">4. Reader reviews</p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Total Shares</span>
                <Share2 className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.totalShares.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">6. External shares</p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Total Bookmarks</span>
                <Bookmark className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.totalBookmarks.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">7. Saved in libraries</p>
            </Card>
          </div>

          {/* Group 3: Reading Behavior */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Reading Sessions</span>
                <BookOpen className="w-4 h-4 text-violet-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.totalReadingSessions.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">8. Reader sessions</p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Total Reading Time</span>
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {formatReadingTime(analytics.totalReadingTimeMinutes)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">9. Cumulative time</p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Avg Duration</span>
                <Clock className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.averageReadingDurationMinutes} min
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">10. Avg per session</p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Pages Read</span>
                <Layers className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {analytics.totalPagesRead.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">11. Total pages turned</p>
            </Card>
          </div>

          {/* Group 4: Performance & Lifecycle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Engagement Rate</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-primary">
                {analytics.engagementRate}%
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                15. Ratio of interactions to total views
              </p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Publication Date</span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-sm font-bold text-foreground">
                {format(new Date(analytics.publicationDate), "MMMM d, yyyy")}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                14. First published {formatDistanceToNow(new Date(analytics.publicationDate), { addSuffix: true })}
              </p>
            </Card>

            <Card className="p-4 bg-card border border-border/80 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                <span className="text-xs font-medium">Last Activity Timestamp</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-sm font-bold text-foreground truncate">
                {analytics.lastActivityTimestamp
                  ? format(new Date(analytics.lastActivityTimestamp), "PPpp")
                  : "Recently active"}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                13. Most recent interaction with this book
              </p>
            </Card>
          </div>
        </div>

        {/* Visual Charts (Recharts) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Views & Downloads AreaChart */}
          <Card className="p-5 bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Traffic & Downloads Over Time
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reader visits and offline downloads
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {timeRange.toUpperCase()}
              </Badge>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeline}>
                  <defs>
                    <linearGradient id="pageViewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="pageDownloadsGrad" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#pageViewsGrad)"
                    name="Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="downloads"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#pageDownloadsGrad)"
                    name="Downloads"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Likes & Comments BarChart */}
          <Card className="p-5 bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-rose-500" />
                  Audience Interactions
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reader upvotes & discussion comments
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Interactivity
              </Badge>
            </div>

            <div className="w-full h-64">
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
      </main>
    </div>
  );
};

export default BookAnalyticsPage;
