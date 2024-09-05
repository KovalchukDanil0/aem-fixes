<!--- This README was auto-generated using 'npm run readme' --> 

# AEM Fixes

AEM Fixes is a modern Chrome Extension designed to eliminate repetitive everyday tasks in AEM Engine by automating them.

![react](https://img.shields.io/badge/react-18.3-green) ![typescript](https://img.shields.io/badge/typescript-5.5-aqua) ![sass](https://img.shields.io/badge/sass-1.78-pink) ![tailwindcss](https://img.shields.io/badge/tailwindcss-3.4-navy) ![daisyui](https://img.shields.io/badge/daisyui-4.12-yellow) ![webextension-polyfill](https://img.shields.io/badge/webextension_polyfill-0.10-red) ![vite](https://img.shields.io/badge/vite-5.4-azure) 

![Armageddon](public/armageddon.png)

## IMPORTANT

You have to upload a JSON file to use this extension. If you want to have your own settings, look at the `template.json` file. Otherwise, if you need a private file, please contact me via messenger or email.

**_Some functions require their parameters to be enabled in options page_** ![Options Button](tutorial/OptionsButton.png) ![Options Page](tutorial/OptionsPage.png)

## Features

### Jira page

* Automatically creating WF by adding simple button, in Jira ticket page, matching the interface: ![settings can enable page](https://img.shields.io/badge/customizable-red) ![jira WF Button](tutorial/jiraWFButton.png)This button will redirect you to create WF page and automatically paste for you ticket number and name
* Auto fix attachment filters to display new content at top ![settings can enable page](https://img.shields.io/badge/customizable-red)

### Almost all pages that you work on

* Fast transition between environments, so you can jump from Live directly to Author: ![multiple tabs](https://img.shields.io/badge/multiple-tabs-green)  
![Env Transition](tutorial/EnvTransition.png)

### Author page

* Open Touch properties in a new tab without page reload needed:![Open Touch Properties](tutorial/OpenTouchProperties.png)
* Open author in AEM tree: ![smart](https://img.shields.io/badge/smart-green) ![Open In AEM Tree](tutorial/OpenInAEMTree.png)
* Showing blocked ticket with link to its parent ticket on the yellow box at the top of the author page

### Live&Perf pages

* Automatically checks for mothersite links on pages, if any, inverts colors of it's link ![settings can enable page](https://img.shields.io/badge/customizable-red)
* Vehicle config number is showing directly on KMI, TDR etc. pages ![dynamic setting](https://img.shields.io/badge/dynamic-green)

### Workflow page

* Auto insert WF title from the link
* Insert some useful links (DL, Market config, etc...)
* Fixing all links it to be in Touch UI

### DAM Tree

* if you link is MAV in classic DAM tree, will momently open it in new window in touch UI

### Context menu

* Open image directly in DAM
* You can jump to eny environment from browser context menu, without opening page in a new tab![Context Menu](tutorial/ContextMenu.png)

cats and memes about programmers hidden in the depths of the codebase

## Installation

AEM Fixes can be downloaded from the chrome web store https://chromewebstore.google.com/detail/aemfixes/enncmomonbnjkpljcmahbooohommdmnk

Also it can be built from source:

* clone repository
* run `npm install`
* then `npm run build:chrome`
* on `chrome://extensions` page, load unpacked /build folder or use zip file in /zip folder