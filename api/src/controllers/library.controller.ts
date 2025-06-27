import { Request, Response } from 'express';
import { Library } from '../models/library.model';
import { LibraryAnalytics } from '../models/library-analytics.model';

export const libraryController = {
  // Get a specific library
  async getLibrary(req: Request, res: Response) {
    try {
      const library = await Library.findById(req.params.libraryId);
      if (!library) {
        res.status(404).json({ message: 'Library not found' });
        return;
      }
      res.json(library);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching library', error });
    }
  },

  // Get library content
  async getLibraryContent(req: Request, res: Response) {
    try {
      const library = await Library.findById(req.params.libraryId);
      if (!library) {
        res.status(404).json({ message: 'Library not found' });
        return;
      }
      res.json(library.items);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching library content', error });
    }
  },

  // Add content to library
  async addContent(req: Request, res: Response) {
    try {
      const { contentId, purchasePrice, licenseType } = req.body;
      const library = await Library.findById(req.params.libraryId);
      
      if (!library) {
        res.status(404).json({ message: 'Library not found' });
        return;
      }

      library.items.push({
        contentId,
        purchaseDate: new Date(),
        purchasePrice,
        currentValue: purchasePrice,
        licenseType,
        isLent: false,
      });

      await library.save();

      // Update analytics
      const analytics = await LibraryAnalytics.findOne({ libraryId: library._id });
      if (analytics) {
        analytics.totalValue += purchasePrice;
        analytics.valueHistory.push({
          value: analytics.totalValue,
          timestamp: new Date(),
        });
        await analytics.save();
      }

      res.json(library);
    } catch (error) {
      res.status(500).json({ message: 'Error adding content to library', error });
    }
  },

  // Lend content
  async lendContent(req: Request, res: Response) {
    try {
      const { email, duration } = req.body;
      const library = await Library.findById(req.params.libraryId);
      
      if (!library) {
        return res.status(404).json({ message: 'Library not found' });
      }

      const contentItem = library.items.find(
        (item) => item.contentId === req.params.contentId
      );

      if (!contentItem) {
        return res.status(404).json({ message: 'Content not found in library' });
      }

      if (contentItem.isLent) {
        return res.status(400).json({ message: 'Content is already lent' });
      }

      contentItem.isLent = true;
      contentItem.lentTo = email;
      contentItem.licenseExpiry = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

      await library.save();

      // Update analytics
      const analytics = await LibraryAnalytics.findOne({ libraryId: library._id });
      if (analytics) {
        analytics.lendingMetrics.totalLends += 1;
        analytics.lendingMetrics.averageLendDuration = 
          (analytics.lendingMetrics.averageLendDuration * (analytics.lendingMetrics.totalLends - 1) + duration) /
          analytics.lendingMetrics.totalLends;
        await analytics.save();
      }

      res.json(contentItem);
    } catch (error) {
      res.status(500).json({ message: 'Error lending content', error });
    }
  },

  // Return lent content
  async returnContent(req: Request, res: Response) {
    try {
      const library = await Library.findById(req.params.libraryId);
      
      if (!library) {
        return res.status(404).json({ message: 'Library not found' });
      }

      const contentItem = library.items.find(
        (item) => item.contentId === req.params.contentId
      );

      if (!contentItem) {
        return res.status(404).json({ message: 'Content not found in library' });
      }

      if (!contentItem.isLent) {
        return res.status(400).json({ message: 'Content is not lent' });
      }

      contentItem.isLent = false;
      contentItem.lentTo = undefined;
      contentItem.licenseExpiry = undefined;

      await library.save();
      res.json(contentItem);
    } catch (error) {
      res.status(500).json({ message: 'Error returning content', error });
    }
  },

  // Update content value
  async updateContentValue(req: Request, res: Response) {
    try {
      const { newValue } = req.body;
      const library = await Library.findById(req.params.libraryId);
      
      if (!library) {
        return res.status(404).json({ message: 'Library not found' });
      }

      const contentItem = library.items.find(
        (item) => item.contentId === req.params.contentId
      );

      if (!contentItem) {
        return res.status(404).json({ message: 'Content not found in library' });
      }

      const valueDifference = newValue - contentItem.currentValue;
      contentItem.currentValue = newValue;

      await library.save();

      // Update analytics
      const analytics = await LibraryAnalytics.findOne({ libraryId: library._id });
      if (analytics) {
        analytics.totalValue += valueDifference;
        analytics.valueHistory.push({
          value: analytics.totalValue,
          timestamp: new Date(),
        });
        await analytics.save();
      }

      res.json(contentItem);
    } catch (error) {
      res.status(500).json({ message: 'Error updating content value', error });
    }
  },
}; 