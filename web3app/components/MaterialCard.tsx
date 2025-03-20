import React, { useState, useRef } from 'react';
import { Card, Text } from 'react-native-paper';
import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type MaterialCardProps = {
  mainText?: string;
  subText?: string;
  icon?: string;
  color?: string;
  onPress: (mainText: string, subText: string) => void;
  isEditing: boolean;
  isActive?: boolean;
};

const MaterialCard: React.FC<MaterialCardProps> = ({
  mainText = "Create New Card",
  subText = "Data",
  icon = 'chart-bar',
  color = 'gray',
  onPress,
  isEditing,
  isActive = true // ✅ FIX: Ensure it's a boolean
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const displayIcon = !isActive ? 'plus' : (isEditing ? 'delete' : icon);

  return (
    <TouchableOpacity
      onPress={() => onPress(mainText, subText)}
      onPressIn={handlePressIn}  // ✅ React Native animation
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Card style={[styles.card, !isActive && styles.inactive]}>
          <Card.Content style={styles.cardContent}>
            <MaterialCommunityIcons
              name={displayIcon}
              size={20}
              color={isEditing ? 'gray' : color}
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {mainText}
              </Text>
              <Text style={styles.paragraph} numberOfLines={1} ellipsizeMode="tail">
                {subText}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 5,
    backgroundColor: '#fff',
    height: 'auto',
  },
  inactive: {
    opacity: 0,
    pointerEvents: 'none',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  icon: {
    marginHorizontal: 10,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paragraph: {
    fontSize: 12,
    color: 'gray',
  },
});

export default MaterialCard;
