import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search YouTube without API key using RSS feed alternative
    // This is a workaround that doesn't require API keys
    const searchQuery = encodeURIComponent(query);
    const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}&sp=EgIQAQ%253D%253D`; // sp parameter filters for videos only

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch YouTube search results');
    }

    const html = await response.text();

    // Extract video data from the initial data in the HTML
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
    
    if (ytInitialDataMatch && ytInitialDataMatch[1]) {
      try {
        const ytInitialData = JSON.parse(ytInitialDataMatch[1]);
        
        // Navigate through the YouTube data structure
        const contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        
        if (contents) {
          for (const section of contents) {
            const items = section?.itemSectionRenderer?.contents;
            if (items) {
              for (const item of items) {
                const videoRenderer = item?.videoRenderer;
                if (videoRenderer) {
                  const videoId = videoRenderer.videoId;
                  const title = videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText;
                  
                  if (videoId && title) {
                    return NextResponse.json({
                      id: videoId,
                      title: title,
                      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                      url: `https://www.youtube.com/watch?v=${videoId}`
                    });
                  }
                }
              }
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing YouTube data:', parseError);
      }
    }

    // Fallback: Try regex matching for video IDs
    const videoIdMatches = html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
    const titleMatches = html.matchAll(/"title":{"runs":\[{"text":"([^"]+)"/g);
    
    const videoIds = Array.from(videoIdMatches).map(match => match[1]);
    const titles = Array.from(titleMatches).map(match => match[1]);
    
    if (videoIds.length > 0) {
      const videoId = videoIds[0];
      const title = titles[0] || query;
      
      return NextResponse.json({
        id: videoId,
        title: title,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`
      });
    }

    // No video found
    return NextResponse.json(
      { error: 'No video found' },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('Error searching YouTube:', error);
    return NextResponse.json(
      { error: 'Failed to search YouTube', details: error?.message },
      { status: 500 }
    );
  }
}
