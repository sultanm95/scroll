import { useState, useCallback } from 'react';

export function useAniList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMediaDetails = useCallback(async (mediaId, type = 'MANGA') => {
    setLoading(true);
    setError(null);

    const query = `
      query($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) {
          id
          siteUrl
          title {
            english
            romaji
            native
            userPreferred
          }
          type
          startDate {
            year
            month
            day
          }
          bannerImage
          coverImage {
            large
            medium
          }
          chapters
          volumes
          format
          status
          description
          meanScore
          popularity
          favourites
          genres
          tags {
            name
            rank
          }
          characters {
            edges {
              node {
                id
                name {
                  userPreferred
                }
                image {
                  medium
                }
              }
              role
            }
            pageInfo {
              total
            }
          }
          relations {
            edges {
              node {
                id
                title {
                  userPreferred
                }
                coverImage {
                  medium
                }
              }
              relationType
            }
          }
          recommendations {
            edges {
              node {
                mediaRecommendation {
                  id
                  title {
                    userPreferred
                  }
                  coverImage {
                    medium
                  }
                }
              }
            }
          }
          reviews {
            edges {
              node {
                id
                summary
                rating
              }
            }
          }
          staff {
            edges {
              node {
                id
                name {
                  userPreferred
                }
              }
              role
            }
          }
        }
      }
    `;

    const maxRetries = 3;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('http://localhost:3001/api/anilist/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mediaId,
            type
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          const error = new Error(errorData.message || `Server error: ${response.status}`);
          error.status = response.status;
          
          // Retry on 429, 500, 503
          if ((response.status === 429 || response.status === 500 || response.status === 503) && attempt < maxRetries - 1) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Server error ${response.status}. Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw error;
        }

        const data = await response.json();

        if (data.errors) {
          throw new Error(data.errors[0].message || 'Ошибка при загрузке данных');
        }

        // Handle both response formats: { data: { Media } } and { Media }
        const media = data.data?.Media || data.Media;
        
        if (!media) {
          throw new Error('Media data not found in response');
        }
        
        // Transform to output schema
        const result = {
          media: {
            id: media.id,
            siteUrl: media.siteUrl,
            title: {
              english: media.title.english,
              romaji: media.title.romaji,
              native: media.title.native,
              display: media.title.english || media.title.romaji || media.title.native
            },
            type: media.type,
            year: media.startDate?.year || null,
            cover: {
              large: media.coverImage?.large || null,
              medium: media.coverImage?.medium || null
            },
            banner: media.bannerImage || null,
            chapters: media.chapters || null,
            volumes: media.volumes || null,
            format: media.format || null,
            status: media.status || null,
            description: media.description || null,
            genres: media.genres || [],
            tags: (media.tags || [])
              .slice(0, 5)
              .map(tag => ({
                name: tag.name,
                rank: tag.rank || null
              })),
            score10: media.meanScore ? (media.meanScore / 10).toFixed(1) : null,
            popularity: media.popularity || null,
            favourites: media.favourites || null
          },
          characters: {
            total: media.characters?.pageInfo?.total || 0,
            list: (media.characters?.edges || [])
              .map(edge => ({
                id: edge.node.id,
                name: edge.node.name.userPreferred,
                image: edge.node.image?.medium || null,
                role: edge.role || 'UNKNOWN'
              }))
              .sort((a, b) => {
                // Sort by role (MAIN first)
                const roleOrder = { 'MAIN': 0, 'SUPPORTING': 1, 'BACKGROUND': 2 };
                return (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3);
              })
              .slice(0, 12)
          },
          relations: (media.relations?.edges || [])
            .slice(0, 6)
            .map(edge => ({
              id: edge.node.id,
              title: edge.node.title.userPreferred,
              cover: edge.node.coverImage?.medium || null,
              relationType: edge.relationType
            })),
          recommendations: (media.recommendations?.edges || [])
            .slice(0, 6)
            .map(edge => ({
              id: edge.node.mediaRecommendation.id,
              title: edge.node.mediaRecommendation.title.userPreferred,
              cover: edge.node.mediaRecommendation.coverImage?.medium || null
            })),
          reviews: (media.reviews?.edges || [])
            .slice(0, 3)
            .map(edge => ({
              id: edge.node.id,
              summary: edge.node.summary || null,
              rating: edge.node.rating || null
            })),
          staff: (media.staff?.edges || [])
            .slice(0, 5)
            .map(edge => ({
              id: edge.node.id,
              name: edge.node.name.userPreferred,
              role: edge.role
            }))
            .filter(s => s.name),
          ui_hints: {
            readButtonUrl: media.siteUrl || null,
            bookmarkAction: {
              type: 'AniList_mutation',
              note: `Save to AniList library`
            },
            ad_placeholder: false
          }
        };

        setLoading(false);
        return result;
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries - 1) {
          // Last attempt failed
          console.error('Error fetching AniList data:', error);
          setError(error.message);
          setLoading(false);
          throw error;
        }
      }
    }
  }, []);

  return { fetchMediaDetails, loading, error };
}
