import React from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Text,
} from 'react-native';

import { AVAILABLE_CARDS } from './data/availableCards';

import { getScores, clearScores, addScore } from "./util/highScore";

const screen = Dimensions.get('window');
const CARD_WIDTH = Math.floor(screen.width * 0.25);
const CARD_HEIGHT = Math.floor(CARD_WIDTH * (323 / 222));

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#7CB48F',
    flex: 1,
  },
  safearea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scorearea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    borderWidth: 5,
    borderRadius: 3,
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  text: {
    color: "#fff",
    fontSize: 30,
    textAlign: "center",

  }
});

const getColumnOffset = index => {
  switch (index) {
    case 0:
      return 1.2;
    case 1:
      return 0;
    case 2:
      return -1.2;
    default:
      return 0;
  }
};

class Card extends React.Component {
  offset = new Animated.Value(CARD_WIDTH * getColumnOffset(this.props.index));

  componentDidMount() {
    this.timeout = setTimeout(() => {
      Animated.timing(this.offset, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      }).start();
    }, 1000);
  };

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    const { onPress, image, isVisible } = this.props;
    let displayImage = (
      <Image
        source={image}
        style={styles.cardImage}
        resizeMode='contain'
      />
    );

    if (!isVisible) {
      displayImage = (
        <Image
          source={require('./assets/card-back.png')}
          style={styles.cardImage}
          resizeMode='contain'
        />
      );
    }

    const animatedStyles = {
      transform: [
        {
          translateX: this.offset
        }
      ]
    };

    return (
      <TouchableOpacity onPress={onPress}>
        <Animated.View style={[styles.card, animatedStyles]}>{displayImage}</Animated.View>
      </TouchableOpacity>
    );
  }
}

const getRowOffset = (index) => {
  switch (index) {
    case 0:
      return 1.5;
    case 1:
      return 0.5;
    case 2:
      return -0.5;
    case 3:
      return -1.5;
    default:
      return 0;
  }
}

class Row extends React.Component {
  offset = new Animated.Value(CARD_HEIGHT * getRowOffset(this.props.index));

  opacity = new Animated.Value(0);

  componentDidMount() {
    this.timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(this.offset, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(this.opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    }, 1000);
  };

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    const animationStyles = {
      opacity: this.opacity,
      transform: [
        {
          translateY: this.offset
        }
      ]
    }
    return (
      <Animated.View style={[styles.row, animationStyles]}>
        {this.props.children}
      </Animated.View>
    );
  }
}

const initialState = {
  data: [],
  moveCount: 0,
  selectedIndices: [],
  currentImage: null,
  matchedPairs: [],
  highScore: 0,
  time: 0,
  gamestart: false,
};

class App extends React.Component {
  state = initialState;

  componentDidMount() {
    //clearScores();
    this.draw();
  }

  start = () => {
    this.interval = setInterval(() => {
      this.setState(state => ({
        time: state.time + 1,
      }));
    }, 1000);
  }

  componentDidUpdate() {
    if (this.state.matchedPairs.length >= 6) {
      this.gameComplete();
    }
  }

  restart = () => {
    this.setState({ ...initialState }, () => this.draw())
    clearInterval(this.interval);
    this.interval = null;
  };

  gameComplete = () => {
    let score = this.state.moveCount + this.state.time

    getScores()
      .then((scores) => {
        return score < Math.min(...scores);
      })
      .then((newHighScore) => {
        addScore(score);
        return newHighScore ? 'NEW HIGH SCORE!!' : 'Winner';
      })
      .then((message) => {
        Alert.alert(message,
          `You completed the puzzle in ${this.state.moveCount} moves in ${this.state.time} seconds
            \nYour total score was ${score}`,

          [
            {
              text: 'Reset Game',
              onPress: () => this.setState({ ...initialState }, () => this.draw()),
            },
          ]
        );
        clearInterval(this.interval);
        this.interval = null;
      });
  }

  getHighScore = () => {
    getScores()
      .then((scores) => {
        console.log(scores);
        this.setState({
          highScore: Math.min(...scores)
        });
      })
  }

  draw = () => {
    this.getHighScore();
    const possibleCards = [...AVAILABLE_CARDS];
    const selectedCards = [];

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * possibleCards.length);
      const card = possibleCards[randomIndex];

      selectedCards.push(card);
      selectedCards.push(card);

      possibleCards.splice(randomIndex, 1);
    }

    selectedCards.sort(() => 0.5 - Math.random());

    const cardRow = [];
    const columnSize = 3;
    let index = 0;

    while (index < selectedCards.length) {
      cardRow.push(selectedCards.slice(index, columnSize + index));
      index += columnSize;
    }

    const data = cardRow.map((row, i) => {
      return {
        name: i,
        columns: row.map(image => ({ image }))
      }
    });

    this.setState({ data });
  };

  handleCardPress = (cardId, image) => {
    let callWithUserParams = false;
    if (!this.state.gamestart) {
      this.start();
    }
    this.setState(({ selectedIndices, currentImage, matchedPairs, moveCount }) => {
      const nextState = {};

      if (selectedIndices.length > 1) {
        callWithUserParams = true;
        return { selectedIndices: [] }
      }

      nextState.moveCount = moveCount + 1;
      if (selectedIndices.length === 1) {
        if (image === currentImage && !selectedIndices.includes(cardId)) {
          nextState.currentImage = null;
          nextState.matchedPairs = [...matchedPairs, image]
        }
      } else {
        nextState.currentImage = image;
      }

      nextState.selectedIndices = [...selectedIndices, cardId];

      return nextState;
    }, () => {
      if (callWithUserParams) {
        this.handleCardPress(cardId, image);
      }
    });
  };


  render() {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safearea}>
          {this.state.data.map((row, rowIndex) => (
            <Row key={row.name} index={rowIndex}>
              {row.columns.map((card, index) => {
                const cardId = `${row.name}-${card.image}-${index}`;

                return (
                  <Card
                    key={cardId}
                    index={index}
                    onPress={() => this.handleCardPress(cardId, card.image)}
                    image={card.image}
                    isVisible={
                      this.state.selectedIndices.includes(cardId) ||
                      this.state.matchedPairs.includes(card.image)
                    }
                  />
                );
              })}
            </Row>
          ))}
          <SafeAreaView style={styles.scorearea}>
            <Row>
              <Text style={styles.text}>
                {`Count: ${this.state.moveCount}`}
              </Text>
              <Text style={styles.text}>
                {`Time: ${this.state.time} sec`}
              </Text>
            </Row>
            <TouchableOpacity
              onPress={
                () => this.restart()
              }
            >
              <Text style={styles.text}>
                Restart
                        </Text>
            </TouchableOpacity>

          </SafeAreaView>

        </SafeAreaView>
      </View>
    );
  }
}

export default App;
