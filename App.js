/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
} from 'react-native';

import {LineChart} from "react-native-chart-kit";
import { Dimensions } from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

auth()
  .signInAnonymously()
  .then(() => {
    console.log('User signed in anonymously');
  })
  .catch(error => {
    if (error.code === 'auth/operation-not-allowed') {
      console.log('Enable anonymous in your firebase console.');
    }

    console.error(error);
  });

const conditionsCollection = firestore().collection('conditions');
const eventsCollection = firestore().collection('events');


function App() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const [conditionsArray, setConditionsArray] = useState([]);
  const [eventsArray, setEventsArray] = useState([]);

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);

    conditionsCollection.where("uid","==", user.uid).orderBy("timestamp").get().then(querySnapshot => {
      let cArray = [];
      querySnapshot.forEach(doc => {
        cArray.push(doc.data());
      });

      setConditionsArray(cArray);

      cArray.forEach(el => {console.log(el);});

      eventsCollection.where("uid","==", user.uid).get().then(querySnapshot => {
        let eArray = [];
        querySnapshot.forEach(doc => {
                eArray.push(doc.data());
        });

        setEventsArray(eArray);

        if (initializing) setInitializing(false);

    }, error => {console.log(error.code + ": " + error.message);});


    }, error => {console.log(error.code + ": " + error.message);});
  }


  async function addEvent(timestamp, type, data){
    console.log('sending event for user ' + user.uid);

    let eventdoc = {
        uid: user.uid,
        timestamp: timestamp,
        type: type,
        data: data
    };

    setEventsArray([...eventsArray, eventdoc]);
    await eventsCollection.add(eventdoc);

  }

  async function addCondition(timestamp, temp, humd, lux, wlux){
    console.log('sending condition for user ' + user.uid);

    let conditiondoc = {
        uid: user.uid,
        timestamp: timestamp,
        temperature: temp,
        humidity: humd,
        lux: lux,
        whitelux: wlux
    };

    setConditionsArray([...conditionsArray, conditiondoc]);
    await conditionsCollection.add(conditiondoc);
  }

  function addRandomEvent(){
    let ts = firestore.Timestamp.fromDate(new Date());
    addEvent(ts, 'TX_EXAMPLE_TYPE', 2);
  }

  function addRandomCondition(){
    let ts = firestore.Timestamp.fromDate(new Date());
    addCondition(ts, Math.random(), Math.random(), Math.random(), Math.random());
  }

  async function getAllConditions(){
    return await conditionsCollection.get();
  }

  async function getAllEvents(){
    return await eventsCollection.get();
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);


 const conditionItems = conditionsArray.map((conditions) =>
       <Text key={conditions.timestamp + conditions.uid + conditions.temperature}>
        {conditions.timestamp.toString()} {"\n"} {conditions.temperature} {"\n\n"}
       </Text>  );

  return (
      <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Header />
          <View style={styles.body}>
            <View style={styles.sectionContainer}>

            {user ?
                <Text>Welcome {user.uid}</Text> :
                <Text>User not logged in</Text>
            }
            {initializing ?
                <Text>initializing</Text> :
                <Text>initialized</Text>
            }

        <Button
        title="Send Random Condition"
        color="#010101"
        onPress={addRandomCondition.bind(this)}
        />

        {conditionsArray.length?
        <LineChart data={{
                labels: ['   ' + new Date(conditionsArray[0]['timestamp'].toDate()).toLocaleString()]
                        .concat(Array(2).fill("")
                        .concat([new Date(conditionsArray[conditionsArray.length-1]['timestamp'].toDate()).toLocaleString()])),
                datasets: [
                    {
                    data: conditionsArray.map(el => {return el['temperature'];}), //[20, 45, 28, 80, 99, 43],
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
                    strokeWidth: 2
                    }
                ],
                legend: ["Temperature"]
            }}
            width={0.85*Dimensions.get('window').width}
            height={180}
            chartConfig={chartConfig}
            bezier
        />
        :<Text> no data yet </Text>}

        {conditionItems}

        </View>
        </View>
      </ScrollView>
      </SafeAreaView>
      </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
};

export default App;
