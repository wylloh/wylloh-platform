import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Library } from '../models/library.model';
import { Content } from '../models/content.model';
import { Lending } from '../models/lending.model';
import { LibraryAnalytics } from '../models/library-analytics.model';

export const lendingController = {
  // Register a new lending request (first step of blockchain lending)
  async registerLending(req: Request, res: Response) {
    try {
      const { contentId, borrowerEmail, duration, price } = req.body;
      // @ts-ignore
      const userId = req.user._id;

      // Find the content
      const content = await Content.findById(contentId);
      if (!content) {
        return res.status(404).json({ message: 'Content not found' });
      }

      // Find the borrower by email
      const borrower = await User.findOne({ email: borrowerEmail });
      if (!borrower) {
        return res.status(404).json({ message: 'Borrower not found' });
      }

      // Check if the content is in the user's library
      const library = await Library.findOne({ 
        userId, 
        'items.contentId': contentId 
      });

      if (!library) {
        return res.status(404).json({ message: 'Content not found in your library' });
      }

      const contentItem = library.items.find(
        (item) => item.contentId.toString() === contentId
      );

      if (!contentItem) {
        return res.status(404).json({ message: 'Content not found in your library' });
      }

      if (contentItem.isLent) {
        return res.status(400).json({ message: 'Content is already lent' });
      }

      // Create a new lending record
      const lending = new Lending({
        contentId,
        lenderId: userId,
        borrowerId: borrower._id,
        borrowerEmail,
        duration,
        price,
        status: 'pending',
        startDate: new Date(),
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      });

      await lending.save();

      // Return the borrower's address and token contract address for blockchain transaction
      res.json({
        lendingId: lending._id,
        borrowerAddress: borrower.ethereumAddress || null,
        tokenContractAddress: content.contractAddress || null,
        message: 'Lending request registered'
      });
    } catch (error) {
      res.status(500).json({ message: 'Error registering lending request', error });
    }
  },

  // Confirm a lending transaction after blockchain transaction
  async confirmLending(req: Request, res: Response) {
    try {
      const { contentId, lendingId, transactionHash, blockNumber } = req.body;
      // @ts-ignore
      const userId = req.user._id;

      // Find the lending record
      const lending = await Lending.findById(lendingId);
      if (!lending) {
        return res.status(404).json({ message: 'Lending record not found' });
      }

      if (lending.lenderId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to confirm this lending' });
      }

      // Update lending record with blockchain details
      lending.blockchainTransactionHash = transactionHash;
      lending.blockchainBlockNumber = blockNumber;
      lending.status = 'active';
      await lending.save();

      // Update library item status
      const library = await Library.findOne({ 
        userId, 
        'items.contentId': contentId 
      });

      if (library) {
        const contentItem = library.items.find(
          (item) => item.contentId.toString() === contentId
        );

        if (contentItem) {
          contentItem.isLent = true;
          contentItem.lentTo = lending.borrowerEmail;
          await library.save();
        }
      }

      // Update analytics
      const analytics = await LibraryAnalytics.findOne({ libraryId: library?._id });
      if (analytics) {
        analytics.lendingMetrics.totalLends += 1;
        analytics.lendingMetrics.activeLends += 1;
        analytics.lendingMetrics.lendingRevenue += lending.price;
        analytics.lendingMetrics.averageLendDuration = 
          (analytics.lendingMetrics.averageLendDuration * (analytics.lendingMetrics.totalLends - 1) + lending.duration) /
          analytics.lendingMetrics.totalLends;
        await analytics.save();
      }

      res.json({ message: 'Lending confirmed', lending });
    } catch (error) {
      res.status(500).json({ message: 'Error confirming lending', error });
    }
  },

  // Register content return
  async returnContent(req: Request, res: Response) {
    try {
      const { lendingId, transactionHash, blockNumber } = req.body;
      // @ts-ignore
      const userId = req.user._id;

      // Find the lending record
      const lending = await Lending.findById(lendingId);
      if (!lending) {
        return res.status(404).json({ message: 'Lending record not found' });
      }

      if (lending.lenderId.toString() !== userId.toString() && 
          lending.borrowerId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to return this content' });
      }

      // Update lending record
      lending.returnTransactionHash = transactionHash;
      lending.returnBlockNumber = blockNumber;
      lending.status = 'completed';
      lending.actualReturnDate = new Date();
      await lending.save();

      // Update library item status
      const library = await Library.findOne({ 
        userId: lending.lenderId, 
        'items.contentId': lending.contentId 
      });

      if (library) {
        const contentItem = library.items.find(
          (item) => item.contentId.toString() === lending.contentId.toString()
        );

        if (contentItem) {
          contentItem.isLent = false;
          contentItem.lentTo = undefined;
          await library.save();
        }
      }

      // Update analytics
      const analytics = await LibraryAnalytics.findOne({ libraryId: library?._id });
      if (analytics) {
        analytics.lendingMetrics.activeLends -= 1;
        await analytics.save();
      }

      res.json({ message: 'Content returned', lending });
    } catch (error) {
      res.status(500).json({ message: 'Error returning content', error });
    }
  },

  // Cancel a lending agreement
  async cancelLending(req: Request, res: Response) {
    try {
      const { lendingId, transactionHash, blockNumber } = req.body;
      // @ts-ignore
      const userId = req.user._id;

      // Find the lending record
      const lending = await Lending.findById(lendingId);
      if (!lending) {
        return res.status(404).json({ message: 'Lending record not found' });
      }

      if (lending.lenderId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to cancel this lending' });
      }

      // Update lending record
      lending.cancelTransactionHash = transactionHash;
      lending.cancelBlockNumber = blockNumber;
      lending.status = 'cancelled';
      await lending.save();

      // Update library item status
      const library = await Library.findOne({ 
        userId, 
        'items.contentId': lending.contentId 
      });

      if (library) {
        const contentItem = library.items.find(
          (item) => item.contentId.toString() === lending.contentId.toString()
        );

        if (contentItem) {
          contentItem.isLent = false;
          contentItem.lentTo = undefined;
          await library.save();
        }
      }

      res.json({ message: 'Lending cancelled', lending });
    } catch (error) {
      res.status(500).json({ message: 'Error cancelling lending', error });
    }
  },

  // Register payment for lending
  async paymentForLending(req: Request, res: Response) {
    try {
      const { lendingId, transactionHash, blockNumber, amount } = req.body;
      // @ts-ignore
      const userId = req.user._id;

      // Find the lending record
      const lending = await Lending.findById(lendingId);
      if (!lending) {
        return res.status(404).json({ message: 'Lending record not found' });
      }

      if (lending.borrowerId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to pay for this lending' });
      }

      // Update lending record
      lending.paymentTransactionHash = transactionHash;
      lending.paymentBlockNumber = blockNumber;
      lending.paymentAmount = amount;
      lending.paymentDate = new Date();
      lending.isPaid = true;
      await lending.save();

      res.json({ message: 'Payment recorded', lending });
    } catch (error) {
      res.status(500).json({ message: 'Error recording payment', error });
    }
  },

  // Get lending history for a content
  async getLendingHistory(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      // @ts-ignore
      const userId = req.user._id;

      // Check if the content is in the user's library
      const library = await Library.findOne({ 
        userId, 
        'items.contentId': contentId 
      });

      if (!library) {
        return res.status(404).json({ message: 'Content not found in your library' });
      }

      // Get lending history
      const lendings = await Lending.find({ contentId })
        .populate('lenderId', 'name email')
        .populate('borrowerId', 'name email')
        .sort({ startDate: -1 });

      const formattedLendings = lendings.map(lending => ({
        lendingId: lending._id,
        contentId: lending.contentId,
        contentTitle: lending.contentTitle || 'Unknown Title',
        thumbnailUrl: lending.thumbnailUrl || '',
        lender: lending.lenderId?._id || '',
        lenderName: lending.lenderId?.name || 'Unknown',
        borrower: lending.borrowerId?._id || '',
        borrowerName: lending.borrowerId?.name || 'Unknown',
        startDate: lending.startDate,
        endDate: lending.endDate,
        duration: lending.duration,
        price: lending.price,
        status: lending.status
      }));

      res.json(formattedLendings);
    } catch (error) {
      res.status(500).json({ message: 'Error getting lending history', error });
    }
  },

  // Get active lendings for the current user
  async getMyActiveLendings(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user._id;

      // Get active lendings
      const lendings = await Lending.find({ 
        lenderId: userId,
        status: 'active'
      })
        .populate('borrowerId', 'name email')
        .sort({ startDate: -1 });

      const formattedLendings = await Promise.all(lendings.map(async lending => {
        // Get content details
        const content = await Content.findById(lending.contentId);
        
        return {
          lendingId: lending._id,
          contentId: lending.contentId,
          contentTitle: content?.title || lending.contentTitle || 'Unknown Title',
          thumbnailUrl: content?.thumbnailUrl || lending.thumbnailUrl || '',
          lender: lending.lenderId,
          lenderName: 'You',
          borrower: lending.borrowerId?._id || '',
          borrowerName: lending.borrowerId?.name || 'Unknown',
          startDate: lending.startDate,
          endDate: lending.endDate,
          duration: lending.duration,
          price: lending.price,
          status: lending.status
        };
      }));

      res.json(formattedLendings);
    } catch (error) {
      res.status(500).json({ message: 'Error getting active lendings', error });
    }
  },

  // Get active borrowings for the current user
  async getMyActiveBorrowings(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user._id;

      // Get active borrowings
      const lendings = await Lending.find({ 
        borrowerId: userId,
        status: 'active'
      })
        .populate('lenderId', 'name email')
        .sort({ startDate: -1 });

      const formattedLendings = await Promise.all(lendings.map(async lending => {
        // Get content details
        const content = await Content.findById(lending.contentId);
        
        return {
          lendingId: lending._id,
          contentId: lending.contentId,
          contentTitle: content?.title || lending.contentTitle || 'Unknown Title',
          thumbnailUrl: content?.thumbnailUrl || lending.thumbnailUrl || '',
          lender: lending.lenderId?._id || '',
          lenderName: lending.lenderId?.name || 'Unknown',
          borrower: lending.borrowerId,
          borrowerName: 'You',
          startDate: lending.startDate,
          endDate: lending.endDate,
          duration: lending.duration,
          price: lending.price,
          status: lending.status
        };
      }));

      res.json(formattedLendings);
    } catch (error) {
      res.status(500).json({ message: 'Error getting active borrowings', error });
    }
  },

  // Get details for a specific lending
  async getLendingById(req: Request, res: Response) {
    try {
      const { lendingId } = req.params;
      // @ts-ignore
      const userId = req.user._id;

      // Find the lending record
      const lending = await Lending.findById(lendingId)
        .populate('lenderId', 'name email')
        .populate('borrowerId', 'name email');

      if (!lending) {
        return res.status(404).json({ message: 'Lending record not found' });
      }

      // Check if user is authorized to view this lending
      if (lending.lenderId?._id.toString() !== userId.toString() && 
          lending.borrowerId?._id.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this lending' });
      }

      // Get content details
      const content = await Content.findById(lending.contentId);

      const formattedLending = {
        lendingId: lending._id,
        contentId: lending.contentId,
        contentTitle: content?.title || lending.contentTitle || 'Unknown Title',
        thumbnailUrl: content?.thumbnailUrl || lending.thumbnailUrl || '',
        lender: lending.lenderId?._id || '',
        lenderName: lending.lenderId?.name || 'Unknown',
        lenderEmail: lending.lenderId?.email || '',
        borrower: lending.borrowerId?._id || '',
        borrowerName: lending.borrowerId?.name || 'Unknown',
        borrowerEmail: lending.borrowerId?.email || '',
        startDate: lending.startDate,
        endDate: lending.endDate,
        actualReturnDate: lending.actualReturnDate,
        duration: lending.duration,
        price: lending.price,
        status: lending.status,
        isPaid: lending.isPaid,
        paymentDate: lending.paymentDate,
        blockchainTransactionHash: lending.blockchainTransactionHash,
        returnTransactionHash: lending.returnTransactionHash,
        cancelTransactionHash: lending.cancelTransactionHash,
        paymentTransactionHash: lending.paymentTransactionHash
      };

      res.json(formattedLending);
    } catch (error) {
      res.status(500).json({ message: 'Error getting lending details', error });
    }
  }
}; 