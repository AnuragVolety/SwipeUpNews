import { StatusBar } from 'expo-status-bar';
import React, { Component } from 'react';
import { StyleSheet, Text, View, Dimensions, Image, Animated, PanResponder, ActivityIndicator, TextInput, Button, SafeAreaView } from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

class HomeScreen extends Component {
  constructor(props){
    super(props)
    this.position = new Animated.ValueXY()
    this.videoPlaying = false;
    this.swipedCardPosition = new Animated.ValueXY({ x: 0, y: -SCREEN_HEIGHT })
    this.state = {
      currentIndex : 0,
      articles: [],
      isLoading: true
    }
  }

  UNSAFE_componentWillMount(){
    this.setState({isLoading: true});
    this.PanResponder = PanResponder.create({

      onStartShouldSetPanResponder: (e, gestureState) => true,
      onPanResponderMove: (evt, gestureState) => {
        if(gestureState.dy>0 && this.state.currentIndex > 0) {
          this.swipedCardPosition.setValue({
            x:0, y:-SCREEN_HEIGHT+gestureState.dy
          })
        }
        else {
          this.state.currentIndex == 0? this.position.setValue({x:0, y: 0}) : this.position.setValue({x:0, y: gestureState.dy})
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        this.videoPlaying = false;
        if(this.state.currentIndex > 0 && gestureState.dy > 50 && gestureState.vy>0.7){
          Animated.timing(this.swipedCardPosition, {
            toValue:({x:0, y:0}),
            duration: 80
          }).start(()=> {
            this.setState({ currentIndex: this.state.currentIndex - 1 })
            this.swipedCardPosition.setValue({ x: 0, y: -SCREEN_HEIGHT })
          })
        }
        else if (-gestureState.dy > 50 && -gestureState.vy > 0.7 && this.state.currentIndex < this.state.articles.length - 1) {

          Animated.timing(this.position, {
            toValue: ({ x: 0, y: -SCREEN_HEIGHT }),
            duration: 80
          }).start(() => {
            this.setState({ currentIndex: this.state.currentIndex + 1 })
            this.position.setValue({ x: 0, y: 0 })

          })
        }
        else {
          Animated.parallel([
            Animated.spring(this.position, {
              toValue: ({ x: 0, y: 0 })
            }),
            Animated.spring(this.swipedCardPosition, {
              toValue: ({ x: 0, y: -SCREEN_HEIGHT })
            })
          ]).start()
        }
      }
    })
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve)
    });
  }

  fetchNews = async () => {
    try {
      const response = await fetch('http://ihostings.org/cbshorts/getPostCat?cat=4&take=4&skip=1');
      const json = await response.json();
      const newsItems = await json.posts.map((item) => {
        const mediaType = item.url.includes("youtube") ? "video" : "image";
        return {
          id: "" + item.id,
          description: item.description,
          title: item.title,
          mediaType,
          uri: mediaType ==  "image" ? item.image : item.url,
        };
      });
      await this.setStateAsync({articles: newsItems});
    }
    catch (error) {
      console.error(error);
    }
  }

  async componentDidMount() {
    this.setState({isLoading: true});
    await this.fetchNews();
    this.setState({isLoading: false});
    // const playerRef = useRef(null);
    // const [playing, setPlaying] = useState(true);
  }

  renderMedia = (item) => {
    const mediaUri = item.mediaType == "video" ? item.uri.split('=')[1] : item.uri;
    this.videoPlaying = item.mediaType == "video" ? true : false;
    return item.mediaType == "image"? 
    (<View style={{ flex: 2, backgroundColor: 'black' }}>
          <Image source={{uri: mediaUri}}
              style={{ flex: 1, height: null, width: null, resizeMode: 'center', resizeMode: 'stretch' }}
          ></Image>
      </View>) : 
      (
      <View style={{ flex: 2, backgroundColor: 'black' }}>
        <SafeAreaView style={{ flex: 1, marginTop: 60, resizeMode: 'center', resizeMode: 'stretch' }}>
          <YoutubePlayer height={250} videoId={mediaUri} play = {false} />
        </SafeAreaView>
      </View>); 
  }

  renderArticle = (item) => {
    return (<View style={{ flex: 1, position: 'absolute', height: SCREEN_HEIGHT, width: SCREEN_WIDTH, backgroundColor: 'white' }}>

        {this.renderMedia(item)}
        <View style={{ flex: 3, padding: 5 }}>
            <Text style={{fontWeight: "bold", fontSize: 18}}>
              {item.title}
            </Text>
            
            <Text>
                {item.description}
            </Text>
        </View>
    </View>);
  }


  renderArticles = () => {
    return this.state.isLoading ? 
    (
    <View style={{ flex: 1, position: 'absolute', height: SCREEN_HEIGHT, width: SCREEN_WIDTH, backgroundColor: 'white' }}>
      <ActivityIndicator/>
    </View>
    ) :
    this.state.articles.map((item, i) => {
        if (i == this.state.currentIndex - 1) {
            return (
                <Animated.View key={item.id} style={this.swipedCardPosition.getLayout()}
                    {...this.PanResponder.panHandlers}>
                    {this.renderArticle(item)}
                </Animated.View>
            )
        }
        else if (i < this.state.currentIndex) {
            return null
        }
        if (i == this.state.currentIndex) {
            return (
                <Animated.View key={item.id} style={this.position.getLayout()}
                    {...this.PanResponder.panHandlers}>
                      {this.renderArticle(item)}
                </Animated.View>
            )
        }
        else {
            return (
                <Animated.View key={item.id}>
                    {this.renderArticle(item)}
                </Animated.View>
            )
        }
    }).reverse()

}

  render(){
    return (
      <View style={{flex:1}}>
        {this.renderArticles()}
      </View>
    );
  }
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});