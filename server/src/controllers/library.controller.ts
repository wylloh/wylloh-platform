import { Request, Response } from 'express';
import { Library } from '../models/library.model';
import { LibraryAnalytics } from '../models/library-analytics.model';
import mongoose from 'mongoose';

// Extend the Express Request type
interface AuthenticatedRequest extends Request {
  userId: string;
}

export const libraryController = {
  // Get all libraries for a user
  getAllLibraries: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId; // From auth middleware
      
      const libraries = await Library.find({ userId })
        .sort({ updatedAt: -1 })
        .select('-__v');
      
      return res.status(200).json(libraries);
    } catch (error) {
      console.error('Error getting libraries:', error);
      return res.status(500).json({ message: 'Error retrieving libraries' });
    }
  },

  // Get a single library by ID
  getLibraryById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { libraryId } = req.params;
      const userId = req.userId; // From auth middleware
      
      if (!mongoose.Types.ObjectId.isValid(libraryId)) {
        return res.status(400).json({ message: 'Invalid library ID' });
      }
      
      const library = await Library.findOne({ 
        _id: libraryId,
        $or: [
          { userId }, // User owns this library
          { isPublic: true } // Or it's public
        ]
      }).select('-__v');
      
      if (!library) {
        return res.status(404).json({ message: 'Library not found' });
      }
      
      return res.status(200).json(library);
    } catch (error) {
      console.error('Error getting library:', error);
      return res.status(500).json({ message: 'Error retrieving library' });
    }
  },

  // Create a new library
  createLibrary: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId; // From auth middleware
      const { name, description, isPublic } = req.body;
      
      const newLibrary = new Library({
        userId,
        name,
        description,
        isPublic: isPublic !== undefined ? isPublic : true,
        items: []
      });
      
      const savedLibrary = await newLibrary.save();
      return res.status(201).json(savedLibrary);
    } catch (error) {
      console.error('Error creating library:', error);
      return res.status(500).json({ message: 'Error creating library' });
    }
  },

  // Update a library
  updateLibrary: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { libraryId } = req.params;
      const userId = req.userId; // From auth middleware
      const { name, description, isPublic } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(libraryId)) {
        return res.status(400).json({ message: 'Invalid library ID' });
      }
      
      // Ensure user can only update their own libraries
      const library = await Library.findOne({ _id: libraryId, userId });
      
      if (!library) {
        return res.status(404).json({ message: 'Library not found or access denied' });
      }
      
      // Update only allowed fields
      if (name !== undefined) library.name = name;
      if (description !== undefined) library.description = description;
      if (isPublic !== undefined) library.isPublic = isPublic;
      
      const updatedLibrary = await library.save();
      return res.status(200).json(updatedLibrary);
    } catch (error) {
      console.error('Error updating library:', error);
      return res.status(500).json({ message: 'Error updating library' });
    }
  },

  // Delete a library
  deleteLibrary: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { libraryId } = req.params;
      const userId = req.userId; // From auth middleware
      
      if (!mongoose.Types.ObjectId.isValid(libraryId)) {
        return res.status(400).json({ message: 'Invalid library ID' });
      }
      
      // Ensure user can only delete their own libraries
      const result = await Library.deleteOne({ _id: libraryId, userId });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Library not found or access denied' });
      }
      
      return res.status(200).json({ message: 'Library deleted successfully' });
    } catch (error) {
      console.error('Error deleting library:', error);
      return res.status(500).json({ message: 'Error deleting library' });
    }
  },

  // Add item to library
  addItemToLibrary: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { libraryId } = req.params;
      const userId = req.userId; // From auth middleware
      const { 
        contentId, 
        purchasePrice, 
        currentValue, 
        licenseType, 
        licenseExpiry 
      } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(libraryId)) {
        return res.status(400).json({ message: 'Invalid library ID' });
      }
      
      // Ensure user can only modify their own libraries
      const library = await Library.findOne({ _id: libraryId, userId });
      
      if (!library) {
        return res.status(404).json({ message: 'Library not found or access denied' });
      }
      
      // Check if item already exists
      const existingItemIndex = library.items.findIndex(
        item => item.contentId.toString() === contentId
      );
      
      if (existingItemIndex >= 0) {
        return res.status(400).json({ message: 'Item already exists in this library' });
      }
      
      // Add the new item
      library.items.push({
        contentId,
        purchaseDate: new Date(),
        purchasePrice: purchasePrice || 0,
        currentValue: currentValue || purchasePrice || 0,
        licenseType,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
        isLent: false
      });
      
      const updatedLibrary = await library.save();
      return res.status(200).json(updatedLibrary);
    } catch (error) {
      console.error('Error adding item to library:', error);
      return res.status(500).json({ message: 'Error adding item to library' });
    }
  },

  // Remove item from library
  removeItemFromLibrary: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { libraryId, contentId } = req.params;
      const userId = req.userId; // From auth middleware
      
      if (!mongoose.Types.ObjectId.isValid(libraryId)) {
        return res.status(400).json({ message: 'Invalid library ID' });
      }
      
      // Ensure user can only modify their own libraries
      const library = await Library.findOne({ _id: libraryId, userId });
      
      if (!library) {
        return res.status(404).json({ message: 'Library not found or access denied' });
      }
      
      // Remove the item
      const initialItemsCount = library.items.length;
      library.items = library.items.filter(
        item => item.contentId.toString() !== contentId
      );
      
      if (library.items.length === initialItemsCount) {
        return res.status(404).json({ message: 'Item not found in library' });
      }
      
      const updatedLibrary = await library.save();
      return res.status(200).json(updatedLibrary);
    } catch (error) {
      console.error('Error removing item from library:', error);
      return res.status(500).json({ message: 'Error removing item from library' });
    }
  },

  // Update item in library
  updateItemInLibrary: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { libraryId, contentId } = req.params;
      const userId = req.userId; // From auth middleware
      const { 
        currentValue, 
        licenseType, 
        licenseExpiry,
        isLent,
        lentTo
      } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(libraryId)) {
        return res.status(400).json({ message: 'Invalid library ID' });
      }
      
      // Ensure user can only modify their own libraries
      const library = await Library.findOne({ _id: libraryId, userId });
      
      if (!library) {
        return res.status(404).json({ message: 'Library not found or access denied' });
      }
      
      // Find the item
      const itemIndex = library.items.findIndex(
        item => item.contentId.toString() === contentId
      );
      
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in library' });
      }
      
      // Update the item
      const item = library.items[itemIndex];
      
      if (currentValue !== undefined) item.currentValue = currentValue;
      if (licenseType !== undefined) item.licenseType = licenseType;
      if (licenseExpiry !== undefined) item.licenseExpiry = new Date(licenseExpiry);
      if (isLent !== undefined) {
        item.isLent = isLent;
        // If setting to not lent, clear lentTo
        if (!isLent) {
          item.lentTo = undefined;
        }
      }
      if (lentTo !== undefined && isLent !== false) {
        item.lentTo = lentTo;
        item.isLent = true;
      }
      
      const updatedLibrary = await library.save();
      return res.status(200).json(updatedLibrary);
    } catch (error) {
      console.error('Error updating item in library:', error);
      return res.status(500).json({ message: 'Error updating item in library' });
    }
  },

  // Get all items in a library
  getLibraryItems: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { libraryId } = req.params;
      const userId = req.userId; // From auth middleware
      
      if (!mongoose.Types.ObjectId.isValid(libraryId)) {
        return res.status(400).json({ message: 'Invalid library ID' });
      }
      
      const library = await Library.findOne({ 
        _id: libraryId,
        $or: [
          { userId }, // User owns this library
          { isPublic: true } // Or it's public
        ]
      }).select('items');
      
      if (!library) {
        return res.status(404).json({ message: 'Library not found' });
      }
      
      return res.status(200).json(library.items);
    } catch (error) {
      console.error('Error getting library items:', error);
      return res.status(500).json({ message: 'Error retrieving library items' });
    }
  },

  // Get a specific library
  async getLibrary(req: Request, res: Response) {
    try {
      const library = await Library.findById(req.params.libraryId);
      if (!library) {
        return res.status(404).json({ message: 'Library not found' });
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
        return res.status(404).json({ message: 'Library not found' });
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
        return res.status(404).json({ message: 'Library not found' });
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

export default libraryController; 