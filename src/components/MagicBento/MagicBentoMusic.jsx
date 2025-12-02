import { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import AlbumCoverPlayer from '../ui/MusicDisc/MusicDisk';
import DeezerPlayer from '../ui/DeezerPlayer/DeezerPlayer';
import './MagicBentoMusic.css';

const DEFAULT_PARTICLE_COUNT = 20;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '255, 76, 76'; // #ff4c4c
const MOBILE_BREAKPOINT = 768;

const generateDefaultCardData = (userData) => {
  const baseCards = [

  ];

  return baseCards;
};

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = radius => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const ParticleCard = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = false,
  clickEffect = false,
  enableMagnetism = false,
  onClick
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseMove = e => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleClick = e => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        {
          scale: 0,
          opacity: 1
        },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return (
    <div
      ref={cardRef}
      className={`${className} particle-container`}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
    >
      {children}
    </div>
  );
};

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef(null);
  const isInsideSection = useRef(false);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = e => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current.closest('.bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      isInsideSection.current = mouseInside || false;
      const cards = gridRef.current.querySelectorAll('.magic-bento-card');

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
        cards.forEach(card => {
          card.style.setProperty('--glow-intensity', '0');
        });
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardElement = card;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      isInsideSection.current = false;
      gridRef.current?.querySelectorAll('.magic-bento-card').forEach(card => {
        card.style.setProperty('--glow-intensity', '0');
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const BentoCardGrid = ({ children, gridRef }) => (
  <div className="card-grid music-grid bento-section" ref={gridRef}>
    {children}
  </div>
);

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const buildCardData = (userData, playlistData = []) => {
  const defaultMusicCover = 'https://images.genius.com/f2c0421ef6dbcd06eb568d9937b40eac.1000x1000x1.png';

  // Первая карточка - текущий трек
  const musicCard = {
    color: '#060010',
    title: 'Binks Sake',
    description: 'One Piece',
    label: 'Now Playing',
    cover: defaultMusicCover,
    link: '/music'
  };
  const playlistCard = {
    color: '#060010',
    title: 'My Playlist',
    description: 'Your favorite tracks',
    label: 'Playlist',
    cover: 'https://example.com/playlist-cover.jpg',
    link: '/playlist'
  };
  const topMusic = {
    color: '#060010',
    title: 'Top Charts',
    description: 'The most popular tracks',
    label: 'Charts',
    cover: 'https://example.com/playlist-cover.jpg',
    link: '/charts'
  };

  // Четвертая карточка - библиотека/плейлист
  const libraryCard = {
    color: '#060010',
    title: 'My Library',
    description: 'Your collection',
    label: 'Library',
    cover: defaultMusicCover,
    isLibraryCard: true
  };

  const defaultCards = generateDefaultCardData(userData);
  return [musicCard, playlistCard, topMusic, libraryCard, ...defaultCards];
};

const MagicBentoMusic = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true
}) => {
  const navigate = useNavigate();
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const { user, loading, signOut } = useAuth();
  const [playlist, setPlaylist] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [albumInfo, setAlbumInfo] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [cards, setCards] = useState(() => buildCardData(user, []));
  const shouldDisableAnimations = disableAnimations || isMobile;
  const [charts, setCharts] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      setCards(buildCardData(user, playlist));
    }
  }, [user, loading, playlist]);

  useEffect(() => {
    if (user) {
      loadUserPlaylist();
      loadCharts();
    }
  }, [user]);

  const loadCharts = async () => {
    setChartsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/discogs/charts?sort=popularity&page=1&per_page=100`);
      if (response.ok) {
        const data = await response.json();
        console.log('Charts data:', data);
        setCharts(data.results || []);
      } else {
        console.error('Failed to load charts:', response.status);
        setCharts([]);
      }
    } catch (err) {
      console.error('Error loading charts:', err);
      setCharts([]);
    } finally {
      setChartsLoading(false);
    }
  };

  useEffect(() => {
    loadCharts();
  }, []);

  const loadUserPlaylist = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.id}/music-library`);
      if (response.ok) {
        const data = await response.json();
        setPlaylist(data || []);
      }
    } catch (err) {
      console.error('Error loading playlist:', err);
    }
  };

  const loadAlbumTracks = async (discogId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/discogs/release/${discogId}`);
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        const tracks = data.tracklist || data.tracks || [];
        setAlbumTracks(tracks);
        setAlbumInfo({
          title: data.title,
          artist: data.artists?.[0]?.name || 'Unknown',
          images: data.images || [],
          cover: data.images?.[0]?.uri || null
        });
        setSelectedAlbum(discogId);
      } else {
        console.error('Error response:', response.status);
      }
    } catch (err) {
      console.error('Error loading album tracks:', err);
    }
  };

  const handleAddToPlaylist = async (releaseData) => {
    if (!user) {
      alert('Пожалуйста, войдите в аккаунт');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.id}/music-library`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          discogs_id: releaseData.id,
          title: releaseData.title,
          artist: releaseData.artists?.[0]?.name || 'Unknown',
          image: releaseData.thumb || releaseData.cover_image,
          year: releaseData.year || releaseData.basic_information?.year,
          added_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('✅ Трек добавлен в плейлист!');
        loadUserPlaylist();
      } else {
        alert('Ошибка при добавлении трека');
      }
    } catch (err) {
      console.error('Error adding to playlist:', err);
      alert('Ошибка при подключении');
    }
  };

  const handleTrackPlay = (track, index) => {
    // Добавляем информацию об альбоме к треку
    const trackWithAlbumInfo = {
      ...track,
      album: {
        cover_small: albumInfo?.cover || null,
        title: albumInfo?.title || 'Unknown Album'
      },
      artist: {
        name: albumInfo?.artist || 'Unknown Artist'
      }
    };
    setCurrentTrack(trackWithAlbumInfo);
  };

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <BentoCardGrid gridRef={gridRef}>
        {cards.map((card, index) => {
          const cardId = `${card.title}-${index}`;
          const baseClassName = [
            'magic-bento-card',
            textAutoHide ? 'magic-bento-card--text-autohide' : '',
            enableBorderGlow ? 'magic-bento-card--border-glow' : ''
          ].filter(Boolean).join(' ');

          const cardProps = {
            key: cardId,
            className: baseClassName,
            style: {
              backgroundColor: card.color,
              '--glow-color': glowColor
            }
          };

          // Обработчик клика для навигации
          const handleCardClick = () => {
            console.log('Card clicked:', card.title, 'with link:', card.link);
            if (card.link) {
              console.log('Attempting to navigate to:', card.link);
              navigate(card.link);
            }
          };

          // Ветка с ParticleCard (твой "enableStars")
          if (enableStars) {
            const { key, ...restCardProps } = cardProps;
            return (
              <ParticleCard
                key={key}
                {...restCardProps}
                onClick={() => {
                  console.log('ParticleCard clicked:', card.title);
                  if (card.link) {
                    console.log('Navigating to:', card.link);
                    navigate(card.link);
                  }
                }}
                style={{
                  ...cardProps.style,
                  cursor: card.link ? 'pointer' : 'default'
                }}
                disableAnimations={shouldDisableAnimations}
                particleCount={particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                clickEffect={clickEffect}
                enableMagnetism={enableMagnetism}
              >
                {index === 0 ? (
                  <>
                    {currentTrack ? (
                      <>
                        <div 
                          className="music-card-background" 
                          style={{ 
                            backgroundImage: `url(${currentTrack?.album?.cover_small})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            opacity: 0.3
                          }} 
                        />
                        <AlbumCoverPlayer 
                          size={100}
                          spinning={true}
                          speed={8}
                          title={currentTrack?.title}
                          coverUrl={currentTrack?.album?.cover_small}
                          artist={currentTrack?.artist?.name || currentTrack?.artists?.[0]?.name || ''}
                        />
                        <div className="music-card-container">
                          <DeezerPlayer 
                            tracks={albumTracks}
                            onTrackPlay={handleTrackPlay}
                          />
                        </div>
                      </>
                    ) : (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--muted)'
                      }}>
                        <div style={{ fontSize: '14px', textAlign: 'center' }}>
                          Выберите трек
                        </div>
                      </div>
                    )}
                  </>
                ) : index === 1 ? (
                  <div 
                    className="magic-bento-card__content"
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      overflow: 'auto',
                      maxHeight: '100%',
                      width: '100%',
                      height: '100%',
                      padding: '12px'
                    }}
                  >
                    {selectedAlbum && albumTracks.length > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
                            {playlist.find(p => p.discogs_id === selectedAlbum)?.title}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedAlbum(null);
                              setAlbumTracks([]);
                            }}
                            style={{
                              padding: '4px 12px',
                              background: 'rgba(255, 76, 76, 0.2)',
                              color: 'var(--accent)',
                              border: '1px solid var(--accent)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 76, 76, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 76, 76, 0.2)';
                            }}
                          >
                            ← Назад
                          </button>
                        </div>
                        {albumTracks.map((track, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              handleTrackPlay(track, idx);
                            }}
                            style={{
                              padding: '8px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: 'var(--text)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              borderLeft: '2px solid var(--accent)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 76, 76, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            title={`${track.position}. ${track.title}`}
                          >
                            <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                              {track.position}. {track.title}
                            </div>
                            {track.artists && track.artists.length > 0 && (
                              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                                {track.artists.map(a => a.name).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                        Выберите альбом
                      </div>
                    )}
                  </div>
                ) : index === 2 ? (
                  <div 
                    className="magic-bento-card__content"
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      overflow: 'hidden',
                      maxHeight: '100%',
                      padding: '16px',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(255, 76, 76, 0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: 'var(--accent)'
                      }}>
                        TOP 10 CHARTS
                      </div>
                      <button 
                        onClick={() => navigate('/charts')}
                        style={{
                          padding: '4px 12px',
                          background: 'rgba(255, 76, 76, 0.2)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 76, 76, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 76, 76, 0.2)';
                        }}
                      >
                        VIEW ALL →
                      </button>
                    </div>

                    {chartsLoading ? (
                      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                        Загрузка...
                      </div>
                    ) : charts.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                        Нет доступных чартов
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        overflow: 'auto',
                        maxHeight: '100%'
                      }}>
                        {charts.slice(0, 10).map((chart, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              if (chart.id) {
                                loadAlbumTracks(chart.id);
                              }
                            }}
                            style={{
                              padding: '10px 12px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: 'var(--text)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              borderLeft: '3px solid var(--accent)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 76, 76, 0.15)';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                            title={chart.title}
                          >
                            <span style={{ color: 'var(--muted)', fontWeight: '600', minWidth: '24px' }}>
                              #{idx + 1}
                            </span>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {chart.title}
                              </div>
                              <div style={{ fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                {chart.resource_url ? 'Discogs' : 'Unknown'}
                              </div>
                            </div>
                            {chart.year && (
                              <span style={{ color: 'var(--muted)', fontSize: '9px' }}>
                                {chart.year}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : index === 3 ? (
                  <div 
                    className="magic-bento-card__content library-content"
                    style={{ 
                      display: 'flex',
                      gap: '0',
                      overflow: 'hidden',
                      maxHeight: '100%',
                      position: 'relative',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    {selectedAlbum && albumTracks.length > 0 ? (
                      <>
                        {/* Полноэкранный альбом */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '16px',
                          padding: '16px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          backdropFilter: 'blur(8px)',
                          zIndex: 10
                        }}>
                          {playlist.find(p => p.discogs_id === selectedAlbum) && (
                            <>
                              <img 
                                src={playlist.find(p => p.discogs_id === selectedAlbum).image || 'https://images.genius.com/f2c0421ef6dbcd06eb568d9937b40eac.1000x1000x1.png'}
                                alt="Album cover"
                                style={{
                                  width: '120px',
                                  height: '120px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '2px solid var(--accent)',
                                  boxShadow: '0 8px 24px rgba(255, 76, 76, 0.3)'
                                }}
                              />
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '600', marginBottom: '4px' }}>
                                  {playlist.find(p => p.discogs_id === selectedAlbum).title}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                  {playlist.find(p => p.discogs_id === selectedAlbum).artist}
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedAlbum(null);
                                  setAlbumTracks([]);
                                }}
                                style={{
                                  padding: '8px 16px',
                                  background: 'var(--accent)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                Закрыть
                              </button>
                            </>
                          )}
                        </div>

                        {/* Список треков справа */}
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '40%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          overflow: 'auto',
                          padding: '8px',
                          background: 'rgba(0, 0, 0, 0.5)',
                          backdropFilter: 'blur(4px)'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent)', marginBottom: '4px' }}>
                            Треки ({albumTracks.length})
                          </div>
                          {albumTracks.map((track, idx) => (
                            <div 
                              key={idx}
                              style={{
                                padding: '6px 8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '3px',
                                fontSize: '10px',
                                color: 'var(--text)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 76, 76, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              }}
                              title={`${track.position}. ${track.title}`}
                            >
                              <span style={{ color: 'var(--muted)', marginRight: '4px' }}>{track.position}.</span>
                              {track.title}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      /* Сетка альбомов по умолчанию */
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: '8px',
                        overflow: 'auto',
                        maxHeight: '100%',
                        padding: '8px 0',
                        width: '100%'
                      }}>
                        {playlist.map((item) => (
                          <div 
                            key={item.discogs_id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'center',
                              border: selectedAlbum === item.discogs_id ? '2px solid var(--accent)' : '1px solid transparent'
                            }}
                            onClick={() => loadAlbumTracks(item.discogs_id)}
                            onDoubleClick={() => navigate(`/music/${item.discogs_id}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 76, 76, 0.15)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <img 
                              src={item.image || 'https://images.genius.com/f2c0421ef6dbcd06eb568d9937b40eac.1000x1000x1.png'}
                              alt={item.title}
                              style={{
                                width: '100%',
                                aspectRatio: '1',
                                objectFit: 'cover',
                                borderRadius: '3px',
                                border: '1px solid rgba(255, 76, 76, 0.3)'
                              }}
                            />
                            <div style={{ fontSize: '10px', color: 'var(--text)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                              {item.artist}
                            </div>
                          </div>
                        ))}
                        {playlist.length === 0 && (
                          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                            Плейлист пуст
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : index === 1 ? (
                  <>
                    <div 
                      className="magic-bento-card__header"
                      style={{ cursor: 'default' }}
                    >
                      <div className="magic-bento-card__label">{card.label}</div>
                    </div>
                    <div 
                      className="magic-bento-card__content"
                      style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        overflow: 'auto',
                        maxHeight: '100%'
                      }}
                    >
                      {selectedAlbum && albumTracks.length > 0 ? (
                        <>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', marginBottom: '4px' }}>
                            {playlist.find(p => p.discogs_id === selectedAlbum)?.title}
                          </div>
                          {albumTracks.map((track, idx) => (
                            <div 
                              key={idx}
                              style={{
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: 'var(--text)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                borderLeft: '2px solid var(--accent)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 76, 76, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              }}
                              title={`${track.position}. ${track.title}`}
                            >
                              <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                                {track.position}. {track.title}
                              </div>
                              {track.artists && track.artists.length > 0 && (
                                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                                  {track.artists.map(a => a.name).join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                          Выберите альбом слева
                        </div>
                      )}
                    </div>
                  </>
                ) : index === 2 ? (
                  <div 
                    className="magic-bento-card__content"
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      overflow: 'hidden',
                      maxHeight: '100%',
                      padding: '16px',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(255, 76, 76, 0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: 'var(--accent)'
                      }}>
                        TOP 100 CHARTS
                      </div>
                      <button 
                        onClick={() => navigate('/charts')}
                        style={{
                          padding: '4px 12px',
                          background: 'rgba(255, 76, 76, 0.2)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 76, 76, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 76, 76, 0.2)';
                        }}
                      >
                        VIEW ALL →
                      </button>
                    </div>

                    {chartsLoading ? (
                      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                        Загрузка...
                      </div>
                    ) : charts.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                        Нет доступных чартов
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        overflow: 'auto',
                        maxHeight: '100%'
                      }}>
                        {charts.map((chart, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              if (chart.id) {
                                loadAlbumTracks(chart.id);
                              }
                            }}
                            style={{
                              padding: '10px 12px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: 'var(--text)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              borderLeft: '3px solid var(--accent)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 76, 76, 0.15)';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                            title={chart.title}
                          >
                            <span style={{ color: 'var(--muted)', fontWeight: '600', minWidth: '24px' }}>
                              #{idx + 1}
                            </span>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {chart.title}
                              </div>
                              <div style={{ fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                {chart.resource_url ? 'Discogs' : 'Unknown'}
                              </div>
                            </div>
                            {chart.year && (
                              <span style={{ color: 'var(--muted)', fontSize: '9px' }}>
                                {chart.year}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div 
                      className="magic-bento-card__header"
                      onClick={() => {
                        console.log('Clicked on card:', card.title);
                        if (card.link) {
                          console.log('Navigating to:', card.link);
                          navigate(card.link);
                        }
                      }}
                      style={{ cursor: card.link ? 'pointer' : 'default' }}
                    >
                      <div className="magic-bento-card__label">{card.label}</div>
                    </div>
                    <div 
                      className="magic-bento-card__content"
                      onClick={() => {
                        console.log('Clicked on card content:', card.title);
                        if (card.link) {
                          console.log('Navigating to:', card.link);
                          navigate(card.link);
                        }
                      }}
                      style={{ cursor: card.link ? 'pointer' : 'default' }}
                    >
                      <h2 className="magic-bento-card__title">{card.title}</h2>
                      <p className="magic-bento-card__description">{card.description}</p>
                    </div>
                  </>
                )}
              </ParticleCard>
            );
          }

          // Ветка без ParticleCard — чистая карточка с обработчиками мыши
          return (
            <div
              key={index}
              {...cardProps}
              style={{
                ...cardProps.style,
                cursor: card.link ? 'pointer' : 'default',
                position: 'relative',
                transition: 'transform 0.2s ease-in-out'
              }}
              ref={el => {
                if (!el) return;

                const handleMouseMove = e => {
                  if (shouldDisableAnimations) return;

                  const rect = el.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;

                  if (enableTilt) {
                    const rotateX = ((y - centerY) / centerY) * -10;
                    const rotateY = ((x - centerX) / centerX) * 10;
                    gsap.to(el, {
                      rotateX,
                      rotateY,
                      duration: 0.1,
                      ease: 'power2.out',
                      transformPerspective: 1000
                    });
                  }

                  if (enableMagnetism) {
                    const magnetX = (x - centerX) * 0.05;
                    const magnetY = (y - centerY) * 0.05;
                    gsap.to(el, {
                      x: magnetX,
                      y: magnetY,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }
                };

                const handleMouseLeave = () => {
                  if (shouldDisableAnimations) return;

                  if (enableTilt) {
                    gsap.to(el, {
                      rotateX: 0,
                      rotateY: 0,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }

                  if (enableMagnetism) {
                    gsap.to(el, {
                      x: 0,
                      y: 0,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }
                };

                const handleClick = e => {
                  console.log('Card clicked (non-Particle):', card.title);
                  // Сначала проверяем навигацию
                  if (card.link) {
                    console.log('Card has link:', card.link);
                    console.log('Attempting to navigate to:', card.link);
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(card.link);
                    return;
                  }

                  // Затем эффект клика если он включен
                  if (!clickEffect || shouldDisableAnimations) return;

                  const rect = el.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;

                  const maxDistance = Math.max(
                    Math.hypot(x, y),
                    Math.hypot(x - rect.width, y),
                    Math.hypot(x, y - rect.height),
                    Math.hypot(x - rect.width, y - rect.height)
                  );

                  const ripple = document.createElement('div');
                  ripple.style.cssText = `
                    position: absolute;
                    width: ${maxDistance * 2}px;
                    height: ${maxDistance * 2}px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
                    left: ${x - maxDistance}px;
                    top: ${y - maxDistance}px;
                    pointer-events: none;
                    z-index: 1000;
                  `;

                  el.appendChild(ripple);

                  gsap.fromTo(
                    ripple,
                    { scale: 0, opacity: 1 },
                    {
                      scale: 1,
                      opacity: 0,
                      duration: 0.8,
                      ease: 'power2.out',
                      onComplete: () => ripple.remove()
                    }
                  );
                };

                el.addEventListener('mousemove', handleMouseMove);
                el.addEventListener('mouseleave', handleMouseLeave);
                el.addEventListener('click', handleClick);
              }}
            >
              <div className="magic-bento-card__header">
                <div className="magic-bento-card__label">{card.label}</div>
              </div>
              <div className="magic-bento-card__content">
                <h2 className="magic-bento-card__title">{card.title}</h2>
                <p className="magic-bento-card__description">{card.description}</p>
              </div>
            </div>
          );
        })}
      </BentoCardGrid>


    </>
  );
};

export default MagicBentoMusic;
