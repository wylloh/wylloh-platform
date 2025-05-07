import { Request, Response } from 'express';
import { LibraryAnalytics } from '../models/library-analytics.model';
import { Library } from '../models/library.model';

export const libraryAnalyticsController = {
  // Get library analytics
  async getLibraryAnalytics(req: Request, res: Response) {
    try {
      const analytics = await LibraryAnalytics.findOne({
        libraryId: req.params.libraryId,
      });

      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      // Get the last 30 days of value history
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentValueHistory = analytics.valueHistory.filter(
        (entry) => entry.timestamp >= thirtyDaysAgo
      );

      res.json({
        ...analytics.toObject(),
        valueHistory: recentValueHistory,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching analytics', error });
    }
  },

  // Update library value
  async updateLibraryValue(req: Request, res: Response) {
    try {
      const { newValue } = req.body;
      const analytics = await LibraryAnalytics.findOne({
        libraryId: req.params.libraryId,
      });

      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      analytics.totalValue = newValue;
      analytics.valueHistory.push({
        value: newValue,
        timestamp: new Date(),
      });

      await analytics.save();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Error updating library value', error });
    }
  },

  // Track lending activity
  async trackLending(req: Request, res: Response) {
    try {
      const { duration, revenue } = req.body;
      const analytics = await LibraryAnalytics.findOne({
        libraryId: req.params.libraryId,
      });

      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      analytics.lendingMetrics.totalLends += 1;
      analytics.lendingMetrics.totalRevenue += revenue;
      analytics.lendingMetrics.averageLendDuration =
        (analytics.lendingMetrics.averageLendDuration *
          (analytics.lendingMetrics.totalLends - 1) +
          duration) /
        analytics.lendingMetrics.totalLends;

      await analytics.save();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Error tracking lending activity', error });
    }
  },

  // Track engagement metrics
  async trackEngagement(req: Request, res: Response) {
    try {
      const { viewDuration, isUniqueViewer } = req.body;
      const analytics = await LibraryAnalytics.findOne({
        libraryId: req.params.libraryId,
      });

      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      analytics.engagementMetrics.totalViews += 1;
      if (isUniqueViewer) {
        analytics.engagementMetrics.uniqueViewers += 1;
      }

      // Update average watch time
      const currentTotalWatchTime =
        analytics.engagementMetrics.averageWatchTime *
        (analytics.engagementMetrics.totalViews - 1);
      analytics.engagementMetrics.averageWatchTime =
        (currentTotalWatchTime + viewDuration) /
        analytics.engagementMetrics.totalViews;

      await analytics.save();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Error tracking engagement', error });
    }
  },

  // Get value trends
  async getValueTrends(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;
      const analytics = await LibraryAnalytics.findOne({
        libraryId: req.params.libraryId,
      });

      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const filteredHistory = analytics.valueHistory.filter(
        (entry) => entry.timestamp >= startDate
      );

      const initialValue = filteredHistory[0]?.value || 0;
      const finalValue = filteredHistory[filteredHistory.length - 1]?.value || 0;
      const valueChange = finalValue - initialValue;
      const percentageChange = initialValue
        ? (valueChange / initialValue) * 100
        : 0;

      res.json({
        period,
        valueHistory: filteredHistory,
        change: valueChange,
        percentageChange,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching value trends', error });
    }
  },
}; 