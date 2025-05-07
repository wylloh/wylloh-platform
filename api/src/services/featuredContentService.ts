import { FeaturedContent, IFeaturedContent } from '../models/FeaturedContent';

export class FeaturedContentService {
  /**
   * Get all active featured content that is currently valid
   */
  static async getActiveFeaturedContent(): Promise<IFeaturedContent[]> {
    const now = new Date();
    return FeaturedContent.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(6) // Limit to 6 featured items
    .exec();
  }

  /**
   * Add new featured content
   */
  static async addFeaturedContent(data: Partial<IFeaturedContent>): Promise<IFeaturedContent> {
    const featuredContent = new FeaturedContent(data);
    return featuredContent.save();
  }

  /**
   * Update featured content
   */
  static async updateFeaturedContent(id: string, data: Partial<IFeaturedContent>): Promise<IFeaturedContent | null> {
    return FeaturedContent.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).exec();
  }

  /**
   * Delete featured content
   */
  static async deleteFeaturedContent(id: string): Promise<boolean> {
    const result = await FeaturedContent.findByIdAndDelete(id).exec();
    return !!result;
  }

  /**
   * Get featured content by ID
   */
  static async getFeaturedContentById(id: string): Promise<IFeaturedContent | null> {
    return FeaturedContent.findById(id).exec();
  }
} 