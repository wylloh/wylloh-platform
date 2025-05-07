import { Request, Response } from 'express';
import { FeaturedContentService } from '../services/featuredContentService';

export class FeaturedContentController {
  /**
   * Get all active featured content
   */
  static async getActiveFeaturedContent(req: Request, res: Response): Promise<void> {
    try {
      const featuredContent = await FeaturedContentService.getActiveFeaturedContent();
      res.json(featuredContent);
    } catch (error) {
      console.error('Error fetching featured content:', error);
      res.status(500).json({ error: 'Failed to fetch featured content' });
    }
  }

  /**
   * Add new featured content (admin only)
   */
  static async addFeaturedContent(req: Request, res: Response): Promise<void> {
    try {
      const featuredContent = await FeaturedContentService.addFeaturedContent(req.body);
      res.status(201).json(featuredContent);
    } catch (error) {
      console.error('Error adding featured content:', error);
      res.status(500).json({ error: 'Failed to add featured content' });
    }
  }

  /**
   * Update featured content (admin only)
   */
  static async updateFeaturedContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const featuredContent = await FeaturedContentService.updateFeaturedContent(id, req.body);
      
      if (!featuredContent) {
        res.status(404).json({ error: 'Featured content not found' });
        return;
      }

      res.json(featuredContent);
    } catch (error) {
      console.error('Error updating featured content:', error);
      res.status(500).json({ error: 'Failed to update featured content' });
    }
  }

  /**
   * Delete featured content (admin only)
   */
  static async deleteFeaturedContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await FeaturedContentService.deleteFeaturedContent(id);
      
      if (!success) {
        res.status(404).json({ error: 'Featured content not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting featured content:', error);
      res.status(500).json({ error: 'Failed to delete featured content' });
    }
  }

  /**
   * Get featured content by ID
   */
  static async getFeaturedContentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const featuredContent = await FeaturedContentService.getFeaturedContentById(id);
      
      if (!featuredContent) {
        res.status(404).json({ error: 'Featured content not found' });
        return;
      }

      res.json(featuredContent);
    } catch (error) {
      console.error('Error fetching featured content:', error);
      res.status(500).json({ error: 'Failed to fetch featured content' });
    }
  }
} 