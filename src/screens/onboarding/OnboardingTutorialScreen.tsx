import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    ViewToken,
    Image,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mascot, Button } from '../../components/common';
import { COLORS, SPACING } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingTutorialScreenProps {
    navigation: any;
}

interface SlideData {
    id: string;
    title: string;
    subtitle: string;
    illustrationSource?: any;
    isFirstSlide?: boolean;
    lineImage?: any;
}

const slides: SlideData[] = [
    {
        id: '1',
        title: 'Meet Nudge',
        subtitle: 'Your smart AI coach here to\nguide your habit journey.',
        isFirstSlide: true,
    },
    {
        id: '2',
        title: 'Tell Us\nYour Habit',
        subtitle: "We'll learn what's holding you back.",
        illustrationSource: require('../../../assets/onboarding/card1.png'),
        lineImage: require('../../../assets/onboarding/line.png'),
    },
    {
        id: '3',
        title: 'Get Your 21\nday Journey',
        subtitle: 'AI designs a plan built just for you.',
        illustrationSource: require('../../../assets/onboarding/card2.png'),
        lineImage: require('../../../assets/onboarding/line.png'),
    },
    {
        id: '4',
        title: 'Track &\nTransform',
        subtitle: 'Stay consistent and see real change.',
        illustrationSource: require('../../../assets/onboarding/card3.png'),
        lineImage: require('../../../assets/onboarding/line.png'),
    },
];

export const OnboardingTutorialScreen = ({
    navigation,
}: OnboardingTutorialScreenProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const isLastSlide = currentIndex === slides.length - 1;

    const handleSkip = () => {
        navigation.navigate('Login');
    };

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        }
    };

    const handleLetsGo = () => {
        navigation.navigate('Login');
    };

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                setCurrentIndex(viewableItems[0].index);
            }
        }
    ).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderPaginationDots = () => (
        <View style={styles.paginationContainer}>
            {slides.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.paginationDot,
                        index === currentIndex && styles.paginationDotActive,
                    ]}
                />
            ))}
        </View>
    );

    const renderSlide = ({ item, index }: { item: SlideData; index: number }) => {
        if (item.isFirstSlide) {
            // First slide: Large mascot centered with title below
            return (
                <View style={styles.slide}>
                    <View style={styles.firstSlideContent}>
                        {/* Large Mascot */}
                        <View style={styles.largeMascotContainer}>
                            <Mascot size={200} />
                        </View>

                        {/* Title */}
                        <Text style={styles.firstSlideTitle}>{item.title}</Text>

                        {/* Subtitle */}
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                    </View>
                </View>
            );
        }

        // Other slides: Illustration at top, title, subtitle, mascot at bottom-left
        return (
            <View style={styles.slide}>
                {/* Top Illustration */}
                {item.illustrationSource && (
                    <View style={styles.illustrationContainer}>
                        <Image
                            source={item.illustrationSource}
                            style={styles.illustrationImage}
                            resizeMode="contain"
                        />
                    </View>
                )}

                {/* Title */}
                <Text style={styles.title}>{item.title}</Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>{item.subtitle}</Text>

                {/* Curved Line connecting mascot to content */}
                {item.lineImage && (
                    <Image
                        source={item.lineImage}
                        style={styles.lineImage}
                        resizeMode="contain"
                    />
                )}

                {/* Mascot at bottom-left */}
                <View style={styles.mascotContainer}>
                    <Mascot size={140} />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar style="light" />

            {/* Slides */}
            <View style={styles.slidesContainer}>
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    renderItem={renderSlide}
                    keyExtractor={(item) => item.id}
                    horizontal={true}
                    pagingEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    bounces={false}
                    scrollEventThrottle={16}
                />
            </View>

            {/* Bottom section */}
            <View style={styles.bottomContainer}>
                {/* Pagination dots */}
                {renderPaginationDots()}

                {/* Buttons */}
                {isLastSlide ? (
                    <View style={styles.letsGoButtonContainer}>
                        <TouchableOpacity onPress={handleLetsGo} style={styles.letsGoButton}>
                            <Text style={styles.letsGoButtonText}>Let's GO</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                            <Text style={styles.skipButtonText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                            <Text style={styles.nextButtonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: 50,
    },
    slidesContainer: {
        flex: 1,
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        paddingHorizontal: SPACING.xl,
    },

    // ========== FIRST SLIDE STYLES ==========
    firstSlideContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: SCREEN_HEIGHT * 0.1,
    },
    largeMascotContainer: {
        marginBottom: SPACING.xl,
    },
    firstSlideTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },

    // ========== OTHER SLIDES STYLES ==========
    illustrationContainer: {
        alignItems: 'center',
        marginTop: SCREEN_HEIGHT * 0.05,
        height: SCREEN_HEIGHT * 0.3,
    },
    illustrationImage: {
        width: SCREEN_WIDTH * 0.8,
        height: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: SPACING.lg,
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
        opacity: 0.7,
        lineHeight: 20,
    },
    mascotContainer: {
        position: 'absolute',
        bottom: SPACING.md,
        left: SPACING.md,
        zIndex: 2,
        transform: [{ rotate: '-12.53deg' }],

    },
    lineImage: {
        position: 'absolute',
        bottom: SPACING.md + 60, // Positioned relative to mascot
        left: SPACING.md + 90,   // Starting from mascot
        width: 160,
        height: 110,
        zIndex: 1,
        opacity: 0.8,
        transform: [{ rotate: '30deg' }],
    },

    // ========== BOTTOM SECTION STYLES ==========
    bottomContainer: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING['2xl'],
        paddingTop: SPACING.lg,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.gray[600],
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: COLORS.primary,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.gray[600],
        backgroundColor: 'transparent',
    },
    skipButtonText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    nextButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        backgroundColor: COLORS.white,
    },
    nextButtonText: {
        color: COLORS.black,
        fontSize: 14,
        fontWeight: '600',
    },
    letsGoButtonContainer: {
        width: '100%',
    },
    letsGoButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    letsGoButtonText: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OnboardingTutorialScreen;
