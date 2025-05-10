import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  Button,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { userSettingsService, type TokenDisplaySettings } from '../../services/userSettings.service';

interface TokenDisplaySettingsProps {
  onSave?: () => void;
}

const TokenDisplaySettings: React.FC<TokenDisplaySettingsProps> = ({ onSave }) => {
  const [settings, setSettings] = useState<TokenDisplaySettings>(
    userSettingsService.getTokenDisplaySettings()
  );
  const [saved, setSaved] = useState(false);
  
  // Update local state when settings change
  const handleShowOnlyWyllohTokensChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      showOnlyWyllohTokens: event.target.checked
    });
    setSaved(false);
  };
  
  const handleIncludeExternalProtocolTokensChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      includeExternalProtocolTokens: event.target.checked
    });
    setSaved(false);
  };
  
  const handleQualityLevelChange = (event: Event, value: number | number[]) => {
    setSettings({
      ...settings,
      minimumQualityLevel: value as number
    });
    setSaved(false);
  };
  
  // Save settings
  const handleSave = () => {
    userSettingsService.updateTokenDisplaySettings(settings);
    setSaved(true);
    if (onSave) onSave();
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };
  
  // Reset to defaults
  const handleReset = () => {
    const defaultSettings = userSettingsService.getAllSettings().tokenDisplay;
    setSettings(defaultSettings);
    setSaved(false);
  };
  
  // Quality level marks for the slider
  const qualityMarks = [
    {
      value: 0,
      label: 'Any',
    },
    {
      value: 25,
      label: 'Basic',
    },
    {
      value: 50,
      label: 'Good',
    },
    {
      value: 75,
      label: 'High',
    },
    {
      value: 100,
      label: 'Premium',
    },
  ];
  
  return (
    <Card>
      <CardHeader 
        title="Token Display Settings" 
        action={
          <Tooltip title="Reset to defaults">
            <IconButton onClick={handleReset}>
              <SettingsBackupRestoreIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent>
        <Box mb={3}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.showOnlyWyllohTokens}
                onChange={handleShowOnlyWyllohTokensChange}
                color="primary"
              />
            }
            label={
              <Box display="flex" alignItems="center">
                <Typography>Show only Wylloh verified tokens</Typography>
                <Tooltip title="When enabled, only tokens that meet Wylloh quality standards will be displayed">
                  <IconButton size="small">
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
        </Box>
        
        <Box mb={3}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.includeExternalProtocolTokens}
                onChange={handleIncludeExternalProtocolTokensChange}
                color="primary"
                disabled={!settings.showOnlyWyllohTokens}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                <Typography>Include tokens from external platforms using Wylloh protocol</Typography>
                <Tooltip title="When enabled, content from other platforms that implement the Wylloh protocol will also be displayed">
                  <IconButton size="small">
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
        </Box>
        
        <Box mb={3}>
          <Typography gutterBottom>
            Minimum Quality Level
            <Tooltip title="Set the minimum quality level for displayed content. Higher quality means better production value and technical specifications.">
              <IconButton size="small">
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          <Slider
            value={settings.minimumQualityLevel}
            onChange={handleQualityLevelChange}
            aria-labelledby="quality-level-slider"
            step={5}
            min={0}
            max={100}
            marks={qualityMarks}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
          <Box>
            {saved && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Settings saved successfully
              </Alert>
            )}
          </Box>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TokenDisplaySettings; 