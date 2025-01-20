import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest{
    return {
        "name": "ShoppingList",
        "short_name": "ShpLst",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0099e6",
        "theme_color": "#0033cc",
        "description": "En enkel handleliste-app",
        "icons": [
            {
                "src": "/appicon.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/appicon.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    }
}