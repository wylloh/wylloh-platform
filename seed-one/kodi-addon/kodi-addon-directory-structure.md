seed-one/kodi-addon/
├── plugin.video.wylloh/              # Main addon directory
│   ├── addon.xml                     # Addon metadata and dependencies
│   ├── addon.py                      # Main addon entry point
│   ├── resources/                    # Resources directory
│   │   ├── language/                 # Localization
│   │   │   └── resource.language.en_gb/ # English language
│   │   │       └── strings.po        # Localizable strings
│   │   ├── lib/                      # Library code
│   │   │   ├── api.py                # API communication
│   │   │   ├── wallet.py             # Wallet integration
│   │   │   ├── player.py             # Custom player implementation
│   │   │   ├── cache.py              # Content caching
│   │   │   └── utils.py              # Utility functions
│   │   ├── settings.xml              # Addon settings definition
│   │   └── media/                    # Media assets
│   │       ├── icon.png              # Addon icon
│   │       ├── fanart.jpg            # Addon fanart
│   │       └── logos/                # Other logos and images
│   └── LICENSE.txt                   # License information
├── repository.wylloh/                # Repository addon
│   ├── addon.xml                     # Repository metadata
│   └── icon.png                      # Repository icon
└── scripts/                          # Build and packaging scripts
    ├── build.sh                      # Build script
    ├── package.sh                    # Packaging script
    └── install.sh                    # Local installation script