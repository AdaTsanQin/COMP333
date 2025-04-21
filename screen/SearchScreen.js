import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, ActivityIndicator, Image, Alert, TouchableOpacity } from 'react-native';

const SearchScreen = ({ navigation, route }) => {
  // Get username and role if passed from Dashboard
  const { username, role } = route.params || {};
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    // Buildd & log the exact URL
    const params = [
      `term=${encodeURIComponent(query)}`,
      //'limit=5',
      'fulfillment=aisle'
    ].join('&');
    const url = `http://10.0.2.2/WesDashAPI/products.php?${params}`;
    console.log('Calling URL:', url);

    try {
      // make request request
      const response = await fetch(url);
      // Log the HTTP status
      console.log('Response status:', response.status);

      // get the raw text (for debugging)
      const text = await response.text();
      console.log('Raw products.php response:', JSON.stringify(text));

      // parse JSON
      if (!text) {
        Alert.alert('Error', 'Empty response from server');
        return;
      }
      
      // trimming to remove any HTML
      let cleanText = text.trim();
      // Remove any HTML-like content that might be at the beginning - for annoying "unexpected character: <" errors
      if (cleanText.indexOf('{') > 0) {
        cleanText = cleanText.substring(cleanText.indexOf('{'));
      }
      
      try {
        const data = JSON.parse(cleanText);
        // Check if data has the expected structure
        if (data && data.data) {
          // standard Kroger API response format with a "data" array
          setResults(data.data);
        } else if (Array.isArray(data)) {
          // If it's already an array, use it directly
          setResults(data);
        } else {
          // For any other structure, just wrap it in an array
          setResults([data]);
        }
      } catch (parseError) {
        console.error('JSON Parse error:', parseError);
        Alert.alert('Error', 'Invalid response format from server');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item) => {
    // Get product details to pass to CreateRequestScreen
    const productName = item.description || 'Product';
    const brand = item.brand || '';
    const size = item.items && item.items[0]?.size ? item.items[0].size : '';
    
    // Find a thumbnail image URL if available
    let thumbnailUrl = null;
    if (item.images && Array.isArray(item.images)) {
      const frontImage = item.images.find(img => img.featured === true || img.perspective === 'front');
      if (frontImage && frontImage.sizes) {
        const thumbnailSize = frontImage.sizes.find(size => size.size === 'thumbnail' || size.size === 'small');
        if (thumbnailSize) {
          thumbnailUrl = thumbnailSize.url;
        }
      }
    }
    
    // Create a formatted product name with brand and size if available
    let formattedName = productName;
    if (brand) {
      formattedName = `${brand} - ${formattedName}`;
    }
    if (size) {
      formattedName = `${formattedName} (${size})`;
    }
    
    // Navigate to CreateRequestScreen with the product data and user info
    navigation.navigate('CreateRequestScreen', {
      productData: {
        item_name: formattedName,
        image_url: thumbnailUrl,
        product_id: item.productId || item.upc,
      },
      username, // Pass username from Dashboard if available
      role      // Pass role from Dashboard if available
    });
  };

  const renderItem = ({ item }) => {
    // Find a thumbnail image from the Kroger API response format
    let thumbnail = null;
    
    // Based on the Kroger API response format
    if (item.images && Array.isArray(item.images)) {
      // First try to find the featured image or front perspective
      const frontImage = item.images.find(img => 
        img.featured === true || img.perspective === 'front'
      );
      
      if (frontImage && frontImage.sizes) {
        // Get the thumbnail size
        const thumbnailSize = frontImage.sizes.find(size => size.size === 'thumbnail');
        if (thumbnailSize) {
          thumbnail = thumbnailSize.url;
        }
      }
      
      // If no featured/front image found, use the first image with a thumbnail
      if (!thumbnail && item.images.length > 0) {
        for (const img of item.images) {
          if (img.sizes) {
            const thumbnailSize = img.sizes.find(size => size.size === 'thumbnail');
            if (thumbnailSize) {
              thumbnail = thumbnailSize.url;
              break;
            }
          }
        }
      }
    }
    
    // Get product details
    const productName = item.description || 'Product';
    const brand = item.brand || '';
    const size = item.items && item.items[0]?.size ? item.items[0].size : '';
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: '#eee' }]} />
        )}
        <View style={styles.info}>
          <Text style={styles.title}>{productName}</Text>
          <Text style={styles.subtitle}>{brand}</Text>
          {size ? <Text style={styles.size}>{size}</Text> : null}
          <Text style={styles.addText}>Tap to add to order →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search products..."
          value={query}
          onChangeText={setQuery}
        />
        <Button title="Search" onPress={handleSearch} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.productId || item.upc || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No products found. Try a different search term.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', padding: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginRight: 10, paddingHorizontal: 8 },
  loader: { marginTop: 20 },
  list: { padding: 10 },
  card: { 
    flexDirection: 'row', 
    marginBottom: 15, 
    backgroundColor: '#f8f8f8', 
    borderRadius: 8, 
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  thumb: { width: 100, height: 100, backgroundColor: '#eee' },
  info: { flex: 1, padding: 12 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 4 },
  size: { fontSize: 13, color: '#777', fontStyle: 'italic' },
  emptyText: { textAlign: 'center', padding: 20, color: '#666' },
  addText: { 
    fontSize: 13, 
    color: '#3498db', 
    marginTop: 8,
    fontWeight: '500',
  },
});

export default SearchScreen;
