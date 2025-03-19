import React, { useState, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  Card,
  CardMedia,
  IconButton,
  Divider,
  Stack,
  Chip,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';
import {
  CloudUpload,
  MovieCreation,
  Image,
  Clear,
  UploadFile,
  AddPhotoAlternate,
  ArrowBack,
  ArrowForward,
  Check,
  AddCircleOutline,
  DeleteOutline,
  Delete,
  Add
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { uploadToIPFS, checkIpfsConnection } from '../../utils/ipfs';
import { Buffer } from 'buffer';
import { contentService } from '../../services/content.service';

// Define content types
const CONTENT_TYPES = [
  { value: 'movie', label: 'Movie' },
  { value: 'series', label: 'Series' },
  { value: 'short', label: 'Short Film' },
  { value: 'music', label: 'Music' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'ebook', label: 'E-Book' },
  { value: 'art', label: 'Art' },
  { value: 'other', label: 'Other' }
];

// Define steps
const UPLOAD_STEPS = [
  'Basic Information',
  'Media Upload',
  'Preview & Thumbnail',
  'Additional Metadata',
  'Tokenization',
  'Review & Submit'
];

// Define interface for form data
interface UploadFormData {
  title: string;
  description: string;
  contentType: string;
  status: 'draft' | 'pending' | 'active';
  visibility: 'public' | 'private' | 'unlisted';
  metadata: {
    genres?: string[];
    releaseYear?: string;
    duration?: string;
    director?: string;
    cast?: string[];
    tags?: string[];
    isDemo?: boolean;
    demoVersion?: string;
    [key: string]: any;
  };
  mainFile?: File;
  previewFile?: File;
  thumbnailFile?: File;
  tokenization: {
    enabled: boolean;
    initialSupply: number;
    price: number;
    royalty: number;
    rightsThresholds: {
      quantity: number;
      type: string;
    }[];
  };
}

// Define interface for upload status
interface UploadStatus {
  mainFile: {
    progress: number;
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
    cid?: string;
  };
  previewFile: {
    progress: number;
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
    cid?: string;
  };
  thumbnailFile: {
    progress: number;
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
    cid?: string;
  };
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const UploadForm: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  
  // Get auth context
  const { user, isAuthenticated } = useAuth();
  const { active, account } = useWallet();
  
  // Form data state
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    contentType: '',
    status: 'draft',
    visibility: 'private',
    metadata: {
      genres: [],
      tags: [],
      cast: [],
      isDemo: false,
      demoVersion: ''
    },
    tokenization: {
      enabled: false,
      initialSupply: 100,
      price: 0.0025,
      royalty: 15,
      rightsThresholds: [
        { quantity: 1, type: 'Personal Viewing' },
        { quantity: 5, type: 'Family Viewing' },
        { quantity: 10, type: 'Public Display Rights' }
      ]
    }
  });
  
  // Upload status state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    mainFile: { progress: 0, status: 'idle' },
    previewFile: { progress: 0, status: 'idle' },
    thumbnailFile: { progress: 0, status: 'idle' }
  });
  
  // Form validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Stepper state
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // Overall submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Refs for file inputs
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const previewFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom tag/genre/cast input
  const [newTag, setNewTag] = useState<string>('');
  const [newGenre, setNewGenre] = useState<string>('');
  const [newCastMember, setNewCastMember] = useState<string>('');
  
  // Handle basic form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle select field changes
  const handleSelectChange = (e: any) => {
    const name = e.target.name as string;
    const value = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle metadata field changes
  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [name]: value
      }
    }));
  };
  
  // Handle file selection
  const handleFileSelect = (fileType: 'mainFile' | 'previewFile' | 'thumbnailFile') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      setFormData(prev => ({
        ...prev,
        [fileType]: file
      }));
      
      // Reset upload status when a new file is selected
      setUploadStatus(prev => ({
        ...prev,
        [fileType]: { progress: 0, status: 'idle' }
      }));
      
      // Clear validation error
      if (errors[fileType]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fileType];
          return newErrors;
        });
      }
    }
  };
  
  // Handle tag/genre/cast management
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (!formData.metadata.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          tags: [...(prev.metadata.tags || []), newTag.trim()]
        }
      }));
    }
    setNewTag('');
  };
  
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata.tags?.filter(t => t !== tag) || []
      }
    }));
  };
  
  const handleAddGenre = () => {
    if (!newGenre.trim()) return;
    if (!formData.metadata.genres?.includes(newGenre.trim())) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          genres: [...(prev.metadata.genres || []), newGenre.trim()]
        }
      }));
    }
    setNewGenre('');
  };
  
  const handleRemoveGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        genres: prev.metadata.genres?.filter(g => g !== genre) || []
      }
    }));
  };
  
  const handleAddCastMember = () => {
    if (!newCastMember.trim()) return;
    if (!formData.metadata.cast?.includes(newCastMember.trim())) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          cast: [...(prev.metadata.cast || []), newCastMember.trim()]
        }
      }));
    }
    setNewCastMember('');
  };
  
  const handleRemoveCastMember = (member: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        cast: prev.metadata.cast?.filter(m => m !== member) || []
      }
    }));
  };
  
  // Handle file clear
  const handleClearFile = (fileType: 'mainFile' | 'previewFile' | 'thumbnailFile') => {
    setFormData(prev => {
      const newData = { ...prev };
      delete newData[fileType];
      return newData;
    });
    
    // Reset upload status
    setUploadStatus(prev => ({
      ...prev,
      [fileType]: { progress: 0, status: 'idle' }
    }));
  };
  
  // Validation functions
  const validateStep = (step: number): boolean => {
    let newErrors: {[key: string]: string} = {};
    let isValid = true;
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.title.trim()) {
          newErrors.title = 'Title is required';
          isValid = false;
        }
        
        if (!formData.contentType) {
          newErrors.contentType = 'Content type is required';
          isValid = false;
        }
        break;
        
      case 1: // Media Upload
        if (!formData.mainFile) {
          newErrors.mainFile = 'Main content file is required';
          isValid = false;
        }
        break;
        
      case 2: // Preview & Thumbnail
        // Preview and thumbnail are optional but recommended
        break;
        
      case 3: // Additional Metadata
        // All additional metadata is optional
        break;
        
      case 4: // Tokenization
        // Tokenization settings are optional
        break;
        
      case 5: // Review & Submit
        // Final validation before submission
        if (!formData.title.trim()) {
          newErrors.title = 'Title is required';
          isValid = false;
        }
        
        if (!formData.contentType) {
          newErrors.contentType = 'Content type is required';
          isValid = false;
        }
        
        if (!formData.mainFile) {
          newErrors.mainFile = 'Main content file is required';
          isValid = false;
        }
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle step navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // File upload function
  const uploadFile = async (file: File, fileType: 'mainFile' | 'previewFile' | 'thumbnailFile'): Promise<string> => {
    if (!file) throw new Error('No file provided');
    
    // Check IPFS connection first
    const isConnected = await checkIpfsConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to IPFS. Please ensure the IPFS daemon is running in offline mode.');
    }
    
    // Set upload status to uploading
    setUploadStatus(prev => ({
      ...prev,
      [fileType]: { progress: 0, status: 'uploading' }
    }));
    
    try {
      // Convert file to buffer
      const buffer = await file.arrayBuffer().then(Buffer.from);
      
      // Upload to local IPFS node
      const result = await uploadToIPFS(buffer);
      
      // Update upload status to success
      setUploadStatus(prev => ({
        ...prev,
        [fileType]: { 
          progress: 100, 
          status: 'success',
          cid: result.cid
        }
      }));
      
      return result.cid;
    } catch (error: any) {
      console.error(`Error uploading ${fileType}:`, error);
      
      // Update upload status to error
      setUploadStatus(prev => ({
        ...prev,
        [fileType]: { 
          progress: 0, 
          status: 'error',
          message: error.message || 'Upload failed'
        }
      }));
      
      throw error;
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Generate a unique content ID for this upload
      const uploadId = `local-${Date.now()}`;
      
      // Upload main file
      let mainFileCid = '';
      try {
        mainFileCid = formData.mainFile 
          ? await uploadFile(formData.mainFile, 'mainFile')
          : '';
      } catch (error: any) {
        throw new Error(`Failed to upload main file: ${error.message}`);
      }
      
      // Upload preview file if provided
      let previewCid = '';
      try {
        previewCid = formData.previewFile 
          ? await uploadFile(formData.previewFile, 'previewFile')
          : '';
      } catch (error: any) {
        console.warn('Preview file upload failed:', error);
        // Continue without preview file
      }
      
      // Upload thumbnail if provided
      let thumbnailCid = '';
      try {
        thumbnailCid = formData.thumbnailFile 
          ? await uploadFile(formData.thumbnailFile, 'thumbnailFile')
          : '';
      } catch (error: any) {
        console.warn('Thumbnail upload failed:', error);
        // Continue without thumbnail
      }
      
      // Create content in the service
      const contentData: any = {
        id: uploadId, // Ensure a consistent ID is used
        title: formData.title.trim(),
        description: formData.description.trim(),
        contentType: formData.contentType,
        status: formData.status,
        visibility: formData.visibility,
        mainFileCid,
        previewCid,
        thumbnailCid,
        metadata: {
          ...formData.metadata,
          uploadDate: new Date().toISOString(),
          // Add a flag to identify demo content
          isDemo: formData.metadata.isDemo || false,
          demoVersion: formData.metadata.demoVersion || '1.0'
        },
        creatorAddress: account || '0x0',
      };
      
      // Add tokenization data if enabled
      if (formData.tokenization.enabled) {
        contentData.metadata.tokenization = formData.tokenization;
        contentData.rightsThresholds = formData.tokenization.rightsThresholds;
      }
      
      // Create the content with our service - IMPORTANT: Use a consistent ID
      console.log('Creating content with ID:', uploadId);
      const createdContent = await contentService.createContent(contentData);
      
      // Success!
      setSubmitSuccess(true);
      
      // Navigate to TokenizePublishPage after short delay if tokenization is not enabled
      // Otherwise navigate directly to the dashboard
      setTimeout(() => {
        if (formData.tokenization.enabled) {
          // If tokenization is enabled, we'll handle it directly during upload
          navigate('/creator/dashboard', { 
            state: { 
              message: 'Content uploaded successfully with tokenization settings!' 
            }
          });
        } else {
          // Navigate to TokenizePublishPage if tokenization was not enabled
          navigate('/creator/tokenize-publish', { 
            state: { 
              contentInfo: {
                id: createdContent.id,
                title: createdContent.title,
                description: createdContent.description,
                contentType: createdContent.contentType,
                mainFileCid,
                previewCid,
                thumbnailCid,
                metadata: createdContent.metadata,
                tokenization: formData.tokenization
              }
            }
          });
        }
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting content:', error);
      setSubmitError(error.message || 'Failed to submit content');
      
      // Show error in UI
      setUploadStatus(prev => ({
        ...prev,
        mainFile: { 
          ...prev.mainFile,
          status: 'error',
          message: error.message
        }
      }));
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render different step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderMediaUpload();
      case 2:
        return renderPreviewAndThumbnail();
      case 3:
        return renderAdditionalMetadata();
      case 4:
        return renderTokenization();
      case 5:
        return renderReviewAndSubmit();
      default:
        return null;
    }
  };
  
  // Render basic information step
  const renderBasicInfo = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            error={!!errors.title}
            helperText={errors.title}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={4}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.contentType}>
            <InputLabel id="content-type-label">Content Type *</InputLabel>
            <Select
              labelId="content-type-label"
              name="contentType"
              value={formData.contentType}
              onChange={handleSelectChange}
              label="Content Type *"
            >
              {CONTENT_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
            {errors.contentType && (
              <FormHelperText>{errors.contentType}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="visibility-label">Visibility</InputLabel>
            <Select
              labelId="visibility-label"
              name="visibility"
              value={formData.visibility}
              onChange={handleSelectChange}
              label="Visibility"
            >
              <MenuItem value="private">Private (Only you)</MenuItem>
              <MenuItem value="unlisted">Unlisted (Anyone with link)</MenuItem>
              <MenuItem value="public">Public (Listed in marketplace)</MenuItem>
            </Select>
            <FormHelperText>
              You can change this later
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Render media upload step
  const renderMediaUpload = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Media Upload
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Upload Guidelines</AlertTitle>
        <Typography variant="body2">
          - Supported formats: MP4, MOV, AVI, MKV, MP3, PDF, EPUB
        </Typography>
        <Typography variant="body2">
          - Maximum file size: 2GB
        </Typography>
        <Typography variant="body2">
          - Content will be stored securely on IPFS
        </Typography>
      </Alert>
      
      <Paper
        elevation={0}
        sx={{
          border: '2px dashed',
          borderColor: errors.mainFile ? 'error.main' : 'primary.light',
          borderRadius: 2,
          p: 3,
          mb: 3,
          textAlign: 'center',
          backgroundColor: 'background.default'
        }}
      >
        {!formData.mainFile ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 3
            }}
            onClick={() => mainFileInputRef.current?.click()}
          >
            <CloudUpload fontSize="large" color="primary" sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Upload Main Content File
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Click to browse or drag and drop
            </Typography>
            {errors.mainFile && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {errors.mainFile}
              </Typography>
            )}
            <input
              type="file"
              ref={mainFileInputRef}
              onChange={handleFileSelect('mainFile')}
              style={{ display: 'none' }}
            />
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MovieCreation sx={{ mr: 2 }} color="primary" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" noWrap>
                  {formData.mainFile.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatFileSize(formData.mainFile.size)}
                </Typography>
              </Box>
              <IconButton onClick={() => handleClearFile('mainFile')}>
                <Clear />
              </IconButton>
            </Box>
            
            {uploadStatus.mainFile.status === 'uploading' && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={uploadStatus.mainFile.progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                  Uploading... {uploadStatus.mainFile.progress}%
                </Typography>
              </Box>
            )}
            
            {uploadStatus.mainFile.status === 'success' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Upload complete! CID: {uploadStatus.mainFile.cid}
              </Alert>
            )}
            
            {uploadStatus.mainFile.status === 'error' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {uploadStatus.mainFile.message}
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
  
  // Render preview and thumbnail step
  const renderPreviewAndThumbnail = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Preview & Thumbnail
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Why add these?</AlertTitle>
        <Typography variant="body2">
          A preview helps viewers sample your content before purchasing.
          A thumbnail makes your content stand out in the marketplace.
        </Typography>
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Preview File (Optional)
          </Typography>
          
          <Paper
            elevation={0}
            sx={{
              border: '2px dashed',
              borderColor: 'primary.light',
              borderRadius: 2,
              p: 2,
              mb: 3,
              textAlign: 'center',
              backgroundColor: 'background.default'
            }}
          >
            {!formData.previewFile ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 2
                }}
                onClick={() => previewFileInputRef.current?.click()}
              >
                <UploadFile color="primary" sx={{ mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  Upload Preview
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Short clip or excerpt (max 2 minutes)
                </Typography>
                <input
                  type="file"
                  ref={previewFileInputRef}
                  onChange={handleFileSelect('previewFile')}
                  style={{ display: 'none' }}
                />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MovieCreation sx={{ mr: 1 }} color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" noWrap>
                      {formData.previewFile.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatFileSize(formData.previewFile.size)}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={() => handleClearFile('previewFile')}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </Box>
                
                {uploadStatus.previewFile.status === 'uploading' && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={uploadStatus.previewFile.progress}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                )}
                
                {uploadStatus.previewFile.status === 'success' && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Upload complete!
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Thumbnail Image (Optional)
          </Typography>
          
          <Paper
            elevation={0}
            sx={{
              border: '2px dashed',
              borderColor: 'primary.light',
              borderRadius: 2,
              p: 2,
              mb: 3,
              textAlign: 'center',
              backgroundColor: 'background.default'
            }}
          >
            {!formData.thumbnailFile ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 2
                }}
                onClick={() => thumbnailFileInputRef.current?.click()}
              >
                <AddPhotoAlternate color="primary" sx={{ mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  Upload Thumbnail
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Recommended size: 1280x720px
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  ref={thumbnailFileInputRef}
                  onChange={handleFileSelect('thumbnailFile')}
                  style={{ display: 'none' }}
                />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Image sx={{ mr: 1 }} color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" noWrap>
                      {formData.thumbnailFile.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatFileSize(formData.thumbnailFile.size)}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={() => handleClearFile('thumbnailFile')}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </Box>
                
                {uploadStatus.thumbnailFile.status === 'uploading' && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={uploadStatus.thumbnailFile.progress}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                )}
                
                {uploadStatus.thumbnailFile.status === 'success' && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Upload complete!
                  </Alert>
                )}
                
                {/* Preview the thumbnail */}
                {formData.thumbnailFile && (
                  <Box sx={{ mt: 2 }}>
                    <img 
                      src={URL.createObjectURL(formData.thumbnailFile)} 
                      alt="Thumbnail preview"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '120px',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Render additional metadata step
  const renderAdditionalMetadata = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Additional Metadata
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Better Discoverability</AlertTitle>
        <Typography variant="body2">
          Adding detailed metadata helps your content get discovered by the right audience.
        </Typography>
      </Alert>
      
      <Grid container spacing={3}>
        {/* Year, Duration, Director */}
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Release Year"
            name="releaseYear"
            value={formData.metadata.releaseYear || ''}
            onChange={handleMetadataChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Duration"
            name="duration"
            value={formData.metadata.duration || ''}
            onChange={handleMetadataChange}
            placeholder="e.g., 90 minutes"
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Director"
            name="director"
            value={formData.metadata.director || ''}
            onChange={handleMetadataChange}
          />
        </Grid>

        {/* Genres */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Genres
          </Typography>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Add a genre"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGenre();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddGenre}
              disabled={!newGenre.trim()}
              sx={{ ml: 1 }}
            >
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.metadata.tags?.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Render tokenization step
  const renderTokenization = () => {
    return (
      <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Tokenization Settings
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={formData.tokenization.enabled}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    tokenization: {
                      ...formData.tokenization,
                      enabled: e.target.checked
                    }
                  });
                }}
              />
            }
            label="Enable Tokenization"
          />
        </Box>
        
        {formData.tokenization.enabled && (
          <>
            <Typography variant="body2" color="text.secondary" paragraph>
              These settings will determine how your content is tokenized on the blockchain. 
              Once published, these settings cannot be changed. Adjust carefully.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Initial Token Supply"
                  type="number"
                  value={formData.tokenization.initialSupply}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      tokenization: {
                        ...formData.tokenization,
                        initialSupply: Number(e.target.value)
                      }
                    });
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">tokens</InputAdornment>
                  }}
                  helperText="Total number of tokens to create"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Token Price"
                  type="number"
                  value={formData.tokenization.price}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      tokenization: {
                        ...formData.tokenization,
                        price: Number(e.target.value)
                      }
                    });
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">ETH</InputAdornment>
                  }}
                  helperText="Price per token in ETH"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Creator Royalty"
                  type="number"
                  value={formData.tokenization.royalty}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      tokenization: {
                        ...formData.tokenization,
                        royalty: Number(e.target.value)
                      }
                    });
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                  helperText="Secondary sales royalty percentage"
                />
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
              License Rights Tiers
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Define the rights users get at different token ownership levels. Each tier requires a certain number of tokens.
            </Typography>
            
            {formData.tokenization.rightsThresholds.map((threshold, index) => (
              <Box key={index} sx={{ display: 'flex', mb: 2, gap: 2 }}>
                <TextField
                  label="Required Tokens"
                  type="number"
                  value={threshold.quantity}
                  onChange={(e) => {
                    const updatedThresholds = [...formData.tokenization.rightsThresholds];
                    updatedThresholds[index] = {
                      ...updatedThresholds[index],
                      quantity: Number(e.target.value)
                    };
                    setFormData({
                      ...formData,
                      tokenization: {
                        ...formData.tokenization,
                        rightsThresholds: updatedThresholds
                      }
                    });
                  }}
                  sx={{ width: '150px' }}
                />
                
                <TextField
                  fullWidth
                  label="Rights Description"
                  value={threshold.type}
                  onChange={(e) => {
                    const updatedThresholds = [...formData.tokenization.rightsThresholds];
                    updatedThresholds[index] = {
                      ...updatedThresholds[index],
                      type: e.target.value
                    };
                    setFormData({
                      ...formData,
                      tokenization: {
                        ...formData.tokenization,
                        rightsThresholds: updatedThresholds
                      }
                    });
                  }}
                />
                
                {index > 0 && (
                  <IconButton 
                    color="error"
                    onClick={() => {
                      const updatedThresholds = [...formData.tokenization.rightsThresholds];
                      updatedThresholds.splice(index, 1);
                      setFormData({
                        ...formData,
                        tokenization: {
                          ...formData.tokenization,
                          rightsThresholds: updatedThresholds
                        }
                      });
                    }}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
            ))}
            
            <Button
              startIcon={<Add />}
              onClick={() => {
                setFormData({
                  ...formData,
                  tokenization: {
                    ...formData.tokenization,
                    rightsThresholds: [
                      ...formData.tokenization.rightsThresholds,
                      { quantity: 25, type: 'New Rights Tier' }
                    ]
                  }
                });
              }}
              sx={{ mt: 1 }}
            >
              Add Rights Tier
            </Button>
          </>
        )}
      </Box>
    );
  };
  
  // Render review and submit step
  const renderReviewAndSubmit = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review & Submit
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Final Review</AlertTitle>
        <Typography variant="body2">
          Please review all details before submitting. After submission, your content will be uploaded
          {formData.tokenization.enabled 
            ? ' and tokenized according to your settings.' 
            : ' and you will be redirected to the tokenization page.'
          }
        </Typography>
      </Alert>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Content Details
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Title
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formData.title}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Content Type
            </Typography>
            <Typography variant="body1" gutterBottom>
              {CONTENT_TYPES.find(type => type.value === formData.contentType)?.label || formData.contentType}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formData.description || 'No description provided'}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Files
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Main Content File
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formData.mainFile ? formData.mainFile.name : 'No file selected'}
              {formData.mainFile && uploadStatus.mainFile.status === 'success' && (
                <Chip 
                  size="small" 
                  color="success" 
                  label="Uploaded" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Typography>
          </Grid>
          
          {formData.previewFile && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Preview File
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formData.previewFile.name}
                {uploadStatus.previewFile.status === 'success' && (
                  <Chip 
                    size="small" 
                    color="success" 
                    label="Uploaded" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Typography>
            </Grid>
          )}
          
          {formData.thumbnailFile && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Thumbnail Image
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formData.thumbnailFile.name}
                {uploadStatus.thumbnailFile.status === 'success' && (
                  <Chip 
                    size="small" 
                    color="success" 
                    label="Uploaded" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Typography>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Metadata
            </Typography>
          </Grid>
          
          {formData.metadata.genres && formData.metadata.genres.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Genres
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {formData.metadata.genres.map(genre => (
                  <Chip key={genre} label={genre} size="small" />
                ))}
              </Box>
            </Grid>
          )}
          
          {formData.metadata.cast && formData.metadata.cast.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Cast
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {formData.metadata.cast.map(member => (
                  <Chip key={member} label={member} size="small" />
                ))}
              </Box>
            </Grid>
          )}
          
          {formData.metadata.tags && formData.metadata.tags.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {formData.metadata.tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            </Grid>
          )}
          
          {formData.metadata.releaseYear && (
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Release Year
              </Typography>
              <Typography variant="body1">
                {formData.metadata.releaseYear}
              </Typography>
            </Grid>
          )}
          
          {formData.metadata.duration && (
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1">
                {formData.metadata.duration}
              </Typography>
            </Grid>
          )}
          
          {formData.metadata.director && (
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Director
              </Typography>
              <Typography variant="body1">
                {formData.metadata.director}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Success!</AlertTitle>
          Content submitted successfully. You will be redirected to your dashboard.
        </Alert>
      )}
      
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {submitError}
        </Alert>
      )}
    </Box>
  );
  
  // Main component return
  return (
    <Paper sx={{ p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {UPLOAD_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {renderStepContent(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0 || submitting}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
        
        {activeStep === UPLOAD_STEPS.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <Check />}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={submitting}
            endIcon={<ArrowForward />}
          >
            Next
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default UploadForm;