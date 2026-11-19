# Lorem Ipsform

*Lorem ipsum, but for forms.*

A browser extension for Chrome and Firefox that automatically fills web forms with random data. Perfect for testing, development, and quickly filling out forms without having to manually enter data.

It's also shamelessly vibe-coded: written by AI models, first an older one, then reviewed and rebuilt with Claude. Read the code before you trust it with anything important.

## Features

- 🎯 **Smart Text Generation**: Automatically detects field types (email, phone, name, etc.) and generates appropriate content
- 📝 **Multiple Input Types**: Supports text inputs, textareas, email fields, phone fields, and more
- 🎲 **Random Dropdown Selection**: Randomly selects options from dropdown menus
- ☑️ **Checkbox & Radio Handling**: Randomly checks checkboxes and selects radio button options
- ⚙️ **Configurable Options**: Choose which types of form elements to fill
- 💾 **Saves Preferences**: Remembers your settings between uses
- 🚀 **One-Click Operation**: Fill entire forms with a single button click

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your Chrome toolbar

### Manual Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Navigate to the folder containing the extension files
5. Select the folder and click "Select Folder"

## Usage

1. **Navigate to any webpage with forms**
2. **Click the Lorem Ipsform icon** in your browser toolbar
3. **Choose your options**:
   - ✅ Fill text inputs & textareas
   - ✅ Fill dropdown menus  
   - ✅ Fill radio buttons
   - ✅ Fill checkboxes
4. **Click "Fill Forms Now"**
5. **Watch as the extension automatically fills all form elements!**

## What Gets Filled

### Text Inputs & Textareas
- **Email fields**: Generates realistic email addresses
- **Phone fields**: Creates formatted phone numbers
- **Name fields**: Provides first names, last names, or full names
- **City fields**: Selects from a list of major cities
- **Company fields**: Generates company names
- **General text**: Creates lorem ipsum-style text
- **Number fields**: Generates random numbers

### Dropdown Menus
- Randomly selects from available options
- Skips empty/placeholder options
- Triggers change events for dynamic forms

### Radio Buttons
- Groups radio buttons by name
- Randomly selects one option per group
- Handles unnamed radio groups

### Checkboxes
- Randomly checks or unchecks each checkbox (50% probability)
- Works with individual checkboxes and checkbox groups

## Smart Field Detection

The extension uses multiple methods to detect field types:

- **Input type attributes** (`type="email"`, `type="tel"`, `type="url"`, `type="number"`)
- **Placeholder text** (looks for keywords like "email", "phone", "name")
- **Field names and IDs** (`name` and `id`, with `firstName` / `first_name` read as "first name")
- **Labels and autocomplete hints** (`<label>` text, `aria-label`, `autocomplete="given-name"` and so on)

Number fields respect `min`, `max` and `step`, and text never exceeds `maxlength`.

## Files Structure

```
lorem-ipsform/
├── manifest.json       # Extension configuration (Manifest V3, Chrome and Firefox)
├── build.sh            # Builds build/extension/ and a zip
├── content.js          # Main form-filling logic
├── popup.html          # Extension popup interface
├── popup.js            # Popup interaction handling
└── README.md           # This file
```

## Technical Details

- **Manifest Version**: 3, one manifest for Chrome and Firefox 140+
- **Permissions**:
  - `activeTab` + `scripting`: inject the filler into the current tab when you use the popup
  - `storage`: Save user preferences
- **No always-on content script**: the extension only touches pages you ask it to fill
- **Content Security Policy**: Compliant with Chrome's security requirements
- **Event-Driven**: Uses proper event dispatching for form compatibility

## Troubleshooting

### Extension Not Working
- Refresh the webpage and try again
- Check if the page has forms (the extension only works on pages with form elements)
- Make sure the extension has permissions to access the current tab

### No Forms Found
- Verify the page actually contains form elements
- Some dynamic forms may need to be fully loaded before the extension can detect them
- Try scrolling down to load more content if it's a long page

### Fields Not Filling
- Some websites may prevent automatic form filling for security reasons
- Try disabling other form-related extensions that might conflict
- Refresh the page and try again

## Privacy & Security

- **No Data Collection**: This extension doesn't collect, store, or transmit any personal data
- **Local Operation**: All form filling happens locally in your browser
- **No External Requests**: The extension doesn't make any network requests
- **Random Data Only**: All generated data is completely random and fake

## Development

To modify or extend the extension:

1. Edit the relevant files (`content.js`, `popup.js`, `popup.html`)
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

Free to use and modify. No warranty provided.

## Support

If you encounter any issues or have feature requests, please check the troubleshooting section above or create an issue in the project repository.
