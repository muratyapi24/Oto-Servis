import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Slide {
  emoji: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    emoji: "🔧",
    title: "Aracınızı Takip Edin",
    description: "Servis sürecinizi anlık olarak takip edin",
  },
  {
    emoji: "📅",
    title: "Kolay Randevu",
    description: "Birkaç adımda servis randevusu alın",
  },
  {
    emoji: "⭐",
    title: "Sadakat Puanları",
    description: "Her serviste puan kazanın, ödüller alın",
  },
  {
    emoji: "💳",
    title: "Güvenli Ödeme",
    description: "Faturalarınızı güvenle ödeyin",
  },
];

function navigateToLogin() {
  router.replace("/(musteri)/login");
}

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  function handleMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  }

  function handleNext() {
    if (currentPage < SLIDES.length - 1) {
      const nextPage = currentPage + 1;
      scrollRef.current?.scrollTo({ x: nextPage * SCREEN_WIDTH, animated: true });
      setCurrentPage(nextPage);
    } else {
      navigateToLogin();
    }
  }

  const isLastSlide = currentPage === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Skip button — hidden on last slide */}
      <View style={styles.topBar}>
        {!isLastSlide ? (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={navigateToLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Atla</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipBtn} />
        )}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.slideScroll}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Page dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentPage && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaBtn, isLastSlide && styles.ctaBtnPrimary]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, isLastSlide && styles.ctaTextPrimary]}>
            {isLastSlide ? "Başla" : "İleri"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
    minHeight: 48,
    alignItems: "center",
  },
  skipBtn: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primaryContainer,
  },
  slideScroll: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 24,
  },
  emojiWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emoji: {
    fontSize: 56,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.onSurface,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 16,
    color: Colors.outline,
    textAlign: "center",
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.outlineVariant,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primaryContainer,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  ctaBtn: {
    height: 56,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
  },
  ctaBtnPrimary: {
    backgroundColor: Colors.primaryContainer,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  ctaTextPrimary: {
    color: "#fff",
  },
});
