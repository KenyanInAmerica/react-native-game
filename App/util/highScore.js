import { AsyncStorage } from 'react-native';

const KEY = '@GameApp/highScore';

export const getScores = () =>
    AsyncStorage.getItem(KEY).then(str => {
        if (str) {
            return JSON.parse(str);
        }
        return [];
    })

export const addScore = score =>
    getScores().then(oldScores => {
        const newScores = [score, ...oldScores];
        return AsyncStorage.setItem(KEY, JSON.stringify(newScores));
    })

export const clearScores = () => AsyncStorage.multiRemove([KEY]);