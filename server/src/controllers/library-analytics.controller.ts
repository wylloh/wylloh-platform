import { Request, Response } from 'express';
import { LibraryAnalytics } from '../models/library-analytics.model';
import { Library } from '../models/library.model';

export const libraryAnalyticsController = {
  // Get analytics for a specific library
  async getLibraryAnalytics(req: Request, res: Response) {
    try {
      const { libraryId } = req.params;
      const analytics = await LibraryAnalytics.findOne({ libraryId })
        .sort({ 'valueHistory.date': -1 })
        .limit(30); // Get last 30 days of value history

      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching library analytics' });
    }
  },

  // Update library value and metrics
  async updateLibraryValue(req: Request, res: Response) {
    try {
      const { libraryId } = req.params;
      const { newValue } = req.body;

      const analytics = await LibraryAnalytics.findOne({ libraryId });
      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      const previousValue = analytics.totalValue;
      const change = newValue - previousValue;
      const changePercentage = (change / previousValue) * 100;

      analytics.totalValue = newValue;
      analytics.valueHistory.push({
        date: new Date(),
        value: newValue,
        change,
        changePercentage
      });

      await analytics.save();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Error updating library value' });
    }
  },

  // Track lending activity
  async trackLending(req: Request, res: Response) {
    try {
      const { libraryId } = req.params;
      const { duration, revenue } = req.body;

      const analytics = await LibraryAnalytics.findOne({ libraryId });
      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      analytics.lendingMetrics.totalLends += 1;
      analytics.lendingMetrics.activeLends += 1;
      analytics.lendingMetrics.lendingRevenue += revenue;

      // Update average lend duration
      const totalDuration = analytics.lendingMetrics.averageLendDuration * 
        (analytics.lendingMetrics.totalLends - 1) + duration;
      analytics.lendingMetrics.averageLendDuration = 
        totalDuration / analytics.lendingMetrics.totalLends;

      await analytics.save();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Error tracking lending activity' });
    }
  },

  // Track engagement metrics
  async trackEngagement(req: Request, res: Response) {
    try {
      const { libraryId } = req.params;
      const { viewDuration, isUniqueViewer } = req.body;

      const analytics = await LibraryAnalytics.findOne({ libraryId });
      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      analytics.engagementMetrics.views += 1;
      if (isUniqueViewer) {
        analytics.engagementMetrics.uniqueViewers += 1;
      }

      // Update average watch time
      const totalWatchTime = analytics.engagementMetrics.averageWatchTime * 
        (analytics.engagementMetrics.views - 1) + viewDuration;
      analytics.engagementMetrics.averageWatchTime = 
        totalWatchTime / analytics.engagementMetrics.views;

      await analytics.save();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Error tracking engagement metrics' });
    }
  },

  // Get value trends
  async getValueTrends(req: Request, res: Response) {
    try {
      const { libraryId } = req.params;
      const { period } = req.query; // e.g., '7d', '30d', '1y'

      const analytics = await LibraryAnalytics.findOne({ libraryId });
      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      let daysToFetch = 30; // default to 30 days
      if (period === '7d') daysToFetch = 7;
      if (period === '1y') daysToFetch = 365;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToFetch);

      const valueHistory = analytics.valueHistory
        .filter(entry => entry.date >= cutoffDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      res.json({
        valueHistory,
        totalValue: analytics.totalValue,
        periodChange: valueHistory.length > 0 ? 
          analytics.totalValue - valueHistory[0].value : 0,
        periodChangePercentage: valueHistory.length > 0 ?
          ((analytics.totalValue - valueHistory[0].value) / valueHistory[0].value) * 100 : 0
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching value trends' });
    }
  }
}; 