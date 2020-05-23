import React, {Dispatch, FunctionComponent, SetStateAction, useEffect, useState} from 'react';
import {Picker, SafeAreaView, StyleSheet, View, Image, Clipboard} from 'react-native';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import {useMediaQuery} from 'react-responsive';
import useLocalStorageState from "use-local-storage-state";
import {useCollectionData, useDocumentData} from "react-firebase-hooks/firestore";
import {useDownloadURL} from 'react-firebase-hooks/storage';
import addToDate from 'date-fns/add';
import formatDate from 'date-fns/format';
import parseDate from 'date-fns/parse';
import {
    Provider as PaperProvider,
    Button,
    ActivityIndicator,
    Text,
    DarkTheme,
    Appbar,
    Subheading,
    Surface,
    IconButton,
    TouchableRipple,
    RadioButton,
    Caption,
    Menu,
    Theme,
    Portal,
    Modal,
    Headline,
} from 'react-native-paper';
import Nappi from './Nappi';

const guid = (): string => {
    const S4 = function (): string {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return S4() + "-" + S4() + "-" + S4();
}

const calRegex = /\/cal\/([\w\d]+)/;
const calMatch = document.location.pathname.match(calRegex);
if (calMatch) {
    const cal_id: string = calMatch[1];
    try {
        let calendar_ids = JSON.parse(localStorage.getItem('calendarIds') || '');
        if (!calendar_ids.includes(cal_id)) {
            calendar_ids.push(cal_id);
        }
        localStorage.setItem('calendarIds', JSON.stringify(calendar_ids));
    } catch (_e) {
        localStorage.setItem('calendarIds', JSON.stringify([cal_id]));
    } finally {
        history.replaceState('', '', document.location.origin);
    }
}

const firebaseConfig = {
    apiKey: "AIzaSyAu7APU0uEq6FSXhfQ_S9bp2Oit-Ea1lEM",
    authDomain: "paivansade-ecfb0.firebaseapp.com",
    databaseURL: "https://paivansade-ecfb0.firebaseio.com",
    projectId: "paivansade-ecfb0",
    storageBucket: "paivansade-ecfb0.appspot.com",
    messagingSenderId: "193823878468",
    appId: "1:193823878468:web:e10db925d5bc6dbc4bfb11"
};

firebase.initializeApp(firebaseConfig);

const firestore = firebase.firestore();

enum Weather {
    Sunny = 'sunny',
    Rainy = 'rainy',
    Stormy = 'stormy',
}

const timeSelectionItems: Map<number | null, string> = new Map();
timeSelectionItems.set(null, '');
timeSelectionItems.set(1200, '12:00');
timeSelectionItems.set(1230, '12:30');
timeSelectionItems.set(1300, '13:00');
timeSelectionItems.set(1330, '13:30');
timeSelectionItems.set(1400, '14:00');
timeSelectionItems.set(1430, '14:30');
timeSelectionItems.set(1500, '15:00');
timeSelectionItems.set(1530, '15:30');
timeSelectionItems.set(1600, '16:00');
timeSelectionItems.set(1630, '16:30');
timeSelectionItems.set(1700, '17:00');
timeSelectionItems.set(1730, '17:30');
timeSelectionItems.set(1800, '18:00');
timeSelectionItems.set(1830, '18:30');
timeSelectionItems.set(1900, '19:00');
timeSelectionItems.set(1930, '19:30');
timeSelectionItems.set(2000, '20:00');
timeSelectionItems.set(2030, '20:30');
timeSelectionItems.set(2100, '21:00');
timeSelectionItems.set(2130, '21:30');
timeSelectionItems.set(2200, '22:00');
timeSelectionItems.set(2230, '22:30');
timeSelectionItems.set(2300, '23:00');
timeSelectionItems.set(2330, '23:30');

const formatDay = (date: Date) => formatDate(date, 'yyyy-LL-dd');
const parseDay = (day: string) => parseDate(day, 'yyyy-LL-dd', new Date());
const displayDay = (day: string) => parseDay(day).toLocaleDateString();

const previousDay = (date: string) => formatDay(addToDate(parseDay(date), {days: -1}));

const theme: Theme = {
    ...DarkTheme,
    dark: true,
    mode: 'adaptive',
    colors: {
        ...DarkTheme.colors,
        primary: '#c44d27',
        accent: '#c49d27',
    },
};

const colors = {
    gray: '#616161',
    darkGray: '#393939',
}

const style = StyleSheet.create({
    calendarList: {
        padding: 16,
    },
    shareModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        margin: 64,
        width: 196,
    },
    surface: {
        marginBottom: 16,
        elevation: 2,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignContent: 'stretch',
        borderRadius: 4,
    },
    calendarColor: {
        flexGrow: 0,
        flexShrink: 0,
        width: 24,
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
    },
    surfaceContent: {
        padding: 16,
        flexGrow: 1,
        flexShrink: 1,
        alignItems: 'stretch',
    },
    weatherRadio: {
        flexDirection: 'row',
        alignItems: "center",
    },
    weatherRadioText: {
        marginHorizontal: 6,
        opacity: 0.8,
    },
    weatherRadioTextActive: {
        opacity: 1,
    },
    weatherList: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
    },
    weatherListItem: {
        backgroundColor: colors.darkGray,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 4,
        margin: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    calendarTitle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: "center",
    },
    closeButton: {}
});

const weatherIconStyle = {
    width: 28,
    height: 28,
};

interface WeatherIconProps {
    weather: Weather,
    fill: string,
}

const ZzzIcon = () => (
    <svg style={weatherIconStyle}
         focusable="false"
         data-icon="snooze"
         viewBox="0 0 448 512">
        <path style={{fill: colors.gray}}
              d="M176 272H24a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h131.19L3.72 469.75A16.06 16.06 0 0 0 0 480v16a16 16 0 0 0 16 16h168a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H36.81l151.48-165.77A15.94 15.94 0 0 0 192 304v-16a16 16 0 0 0-16-16zM272 0H168a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h78l-98.56 125.2a16.07 16.07 0 0 0-3.44 9.91V176a16 16 0 0 0 16 16h120a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8h-94l98.56-125.2a16.07 16.07 0 0 0 3.44-9.91V16a16 16 0 0 0-16-16zm176 248.89V240a16 16 0 0 0-16-16H328a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h78l-98.56 125.2a16.07 16.07 0 0 0-3.44 9.91V400a16 16 0 0 0 16 16h120a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8h-94l98.59-125.2a16.07 16.07 0 0 0 3.41-9.91z"/>
    </svg>
);

const WeatherIcon: FunctionComponent<WeatherIconProps> = ({weather, fill}) => {
    const pathStyle = {fill: fill};

    if (weather === Weather.Sunny) {
        return (
            <svg
                style={weatherIconStyle}
                fillRule="evenodd"
                strokeLinejoin="round"
                strokeMiterlimit="2"
                clipRule="evenodd"
                viewBox="0 0 48 48">
                <path style={pathStyle}
                      d="M45.994 25.996h-3.998a2 2 0 110-3.999h3.998a2 2 0 010 3.999zm-7.855-13.311a2 2 0 11-2.828-2.828l2.828-2.828a2 2 0 112.828 2.828l-2.828 2.828zm-14.141 23.31c-6.627 0-12-5.372-12-11.998 0-6.627 5.372-11.999 12-11.999 6.627 0 11.998 5.372 11.998 11.999 0 6.626-5.371 11.998-11.998 11.998zm0-19.997a8 8 0 10-.001 15.999 8 8 0 00.001-15.999zm0-7.999a2 2 0 01-2-2V2a2 2 0 014 0v3.999c0 1.104-.897 2-2 2zM9.857 12.685L7.029 9.857a2 2 0 112.828-2.828l2.828 2.828a2 2 0 11-2.828 2.828zM7.999 23.997a2 2 0 01-2 1.999h-4a1.999 1.999 0 010-3.999h4a2 2 0 012 2zm1.858 11.312a2 2 0 112.828 2.828l-2.828 2.828a2 2 0 11-2.828-2.828l2.828-2.828zm14.141 4.686a2 2 0 012 1.999v4a2 2 0 01-4 0v-4a2 2 0 012-1.999zm14.141-4.686l2.828 2.828a2 2 0 11-2.828 2.828l-2.828-2.828a2 2 0 112.828-2.828z"/>
            </svg>
        );
    }
    if (weather === Weather.Rainy) {
        return (
            <svg
                style={weatherIconStyle}
                fillRule="evenodd"
                strokeLinejoin="round"
                strokeMiterlimit="2"
                clipRule="evenodd"
                viewBox="0 0 44 44">
                <path style={pathStyle}
                      d="M35.996 31.299v-4.381a7.993 7.993 0 003.998-6.92c0-4.418-3.58-8-7.998-8a7.937 7.937 0 00-4.334 1.291c-1.232-5.316-5.973-9.29-11.664-9.29C9.371 3.999 4 9.371 4 15.998c0 3.549 1.549 6.729 3.998 8.926v4.914C3.221 27.07 0 21.916 0 15.998 0 7.162 7.162 0 15.998 0c6.004 0 11.229 3.312 13.965 8.203.664-.113 1.336-.205 2.033-.205 6.627 0 11.998 5.373 11.998 12 0 5.221-3.341 9.653-7.998 11.301zm-21.998-11.3a2 2 0 012 2v3.998a2 2 0 01-4 0v-3.998c0-1.106.895-2 2-2zm0 11.998a2 2 0 012 2v3.998a2 2 0 01-4 0v-3.998c0-1.106.895-2 2-2zm7.998-8a2 2 0 012 2v4a2 2 0 01-3.998 0v-4a2 2 0 011.998-2zm0 12c1.105 0 2 .895 2 1.998v4a2 2 0 11-3.998 0v-4c0-1.104.895-1.998 1.998-1.998zm8-15.998a2 2 0 012 2v3.998a2 2 0 01-4 0v-3.998c0-1.106.895-2 2-2zm0 11.998a2 2 0 012 2v3.998a2 2 0 01-4 0v-3.998c0-1.106.895-2 2-2z"/>
            </svg>
        );
    }
    return (
        <svg
            style={weatherIconStyle}
            fillRule="evenodd"
            strokeLinejoin="round"
            strokeMiterlimit="2"
            clipRule="evenodd"
            viewBox="0 0 44 44">
            <path style={pathStyle}
                  d="M31.995,31.998l-1.062,0l3.585,-4.412c3.181,-1.057 5.477,-4.053 5.477,-7.588c0,-4.418 -3.581,-7.998 -7.999,-7.998c-1.601,0 -3.083,0.48 -4.333,1.29c-1.232,-5.316 -5.974,-9.29 -11.665,-9.29c-6.626,0 -11.998,5.372 -11.998,12c0,5.446 3.632,10.038 8.604,11.504l-1.349,3.777c-6.52,-2.021 -11.255,-8.098 -11.255,-15.282c0,-8.835 7.163,-15.999 15.998,-15.999c6.004,0 11.229,3.312 13.965,8.204c0.664,-0.114 1.337,-0.205 2.033,-0.205c6.627,0 11.999,5.371 11.999,11.998c0,6.627 -5.373,12.001 -12,12.001Zm-11.998,-14l9.998,0l-5.999,10l6.999,0l-12.998,15.998l3.6,-11.998l-6.6,0l5,-14Z"/>
        </svg>
    );
};

interface QrImgProps {
    qr_v1: string,
}

const QrImg: FunctionComponent<QrImgProps> = ({qr_v1}) => {
    const ref = firebase.storage().ref(qr_v1);
    const [qr, loading, error] = useDownloadURL(ref);
    if (loading || error) {
        return (
            <ActivityIndicator size="large" style={{width: 164, height: 164}}/>
        )
    }
    return (
        <Image width={164} height={164} source={{uri: qr}}
               style={{width: 164, height: 164}}/>
    );
};

interface WeatherChipProps {
    weather: Weather,
    from?: number,
    isMyWeather: boolean,
}

const WeatherChip: FunctionComponent<WeatherChipProps> = ({weather, from, isMyWeather}) => (
    <View style={style.weatherListItem}>
        <WeatherIcon weather={weather} fill={isMyWeather ? theme.colors.primary : theme.colors.accent}/>
        {weather === Weather.Sunny && from && <Text style={{marginLeft: 4}}>{timeSelectionItems.get(from)}</Text>}
    </View>
);

interface CalendarData {
    id: string,
    title?: string,
    color?: string,
    qr_v1?: string,
}

interface WeatherData {
    id: string,
    date: string,
    weather: Weather,
    from?: number,
    to?: number,
}

interface CalendarViewProps {
    calendarId: string,
    date: string,
    calendarIds: string[],
    setCalendarIds: Dispatch<SetStateAction<string[]>>,
    userId: string,
}

const CalendarView: FunctionComponent<CalendarViewProps> = ({calendarId, date, calendarIds, setCalendarIds, userId}) => {
    const isNarrow = useMediaQuery({
        maxWidth: 600,
    });
    const [calendar, calendarLoading] = useDocumentData<CalendarData>(
        firestore.collection('calendars').doc(calendarId), {idField: 'id'}
    );
    let [myWeather, myWeatherLoading] = useDocumentData<WeatherData>(
        firestore.collection('calendars').doc(calendarId)
            .collection('users').doc(userId)
    );
    let [weathers, weathersLoading] = useCollectionData<WeatherData>(
        firestore.collection('calendars').doc(calendarId)
            .collection('users')
            .where('date', 'in', [date, previousDay(date)]),
        {idField: 'id'}
    );
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [shareOpen, setShareOpen] = useState<boolean>(false);
    const compare = (a: WeatherData, b: WeatherData): number => {
        if (a.weather === Weather.Sunny && b.weather === Weather.Sunny) {
            if (!a.from && b.from) {
                return -1;
            }
            if (a.from && b.from && a.from < b.from) {
                return -1;
            }
            if (!a.from && !b.from && a.id === userId) {
                return -1;
            }
            if (a.from === b.from && a.id === userId) {
                return -1;
            }
        }
        if (a.weather === Weather.Sunny && b.weather !== Weather.Sunny) {
            return -1;
        }
        if (a.weather === Weather.Rainy && b.weather === Weather.Stormy) {
            return -1;
        }
        return 0;
    };
    if (!calendar) {
        return <View/>
    }
    if (myWeather && myWeather.date === previousDay(date) && myWeather.weather === Weather.Stormy) {
        myWeather.date = date;
        myWeather.weather = Weather.Rainy;
    } else if (myWeather?.date !== date) {
        myWeather = undefined;
    }
    if (weathers) {
        weathers = weathers
            .filter(weather => weather.date === date || weather.weather === Weather.Stormy)
            .map(weather => weather.date === date && weather || {
                ...weather,
                weather: Weather.Rainy
            });
        weathers.sort(compare);
    }
    if (calendarLoading || weathersLoading || myWeatherLoading) {
        return (
            <Surface style={{elevation: 2, padding: 16, marginBottom: 16}}>
                <ActivityIndicator/>
            </Surface>
        );
    }
    const setMyTime = (time: string): void => {
        const parsedTime = parseInt(time);
        // noinspection JSIgnoredPromiseFromCall
        firestore.collection('calendars').doc(calendarId)
            .collection('users').doc(userId)
            .set({
                from: parsedTime || null,
            }, {merge: true});
    };

    const setMyWeather = (weather: Weather): void => {
        // noinspection JSIgnoredPromiseFromCall
        firestore.collection('calendars').doc(calendarId)
            .collection('users').doc(userId)
            .set({
                date: date,
                weather: weather,
            }, {merge: true});
    };
    const editColor = (): void => {
        const color = prompt(`Uusi väri kalenterille "${calendar?.title}":`, calendar?.color);
        if (!color) {
            return;
        }
        const hexRegex = /^#[0-9a-fA-F]{6}$/;
        if (!hexRegex.test(color)) {
            alert(`Ei "${color}" sovi väriksi, anna 6 merkkinen heksi`);
            return;
        }
        // noinspection JSIgnoredPromiseFromCall
        firestore.collection('calendars').doc(calendarId).set({color: color}, {merge: true});
    };
    const closeCalendar = (): void => {
        setMenuOpen(false);
        if (!confirm('Haluatko varmasti poistua kalenterista?')) {
            return;
        }
        setCalendarIds(calendarIds.filter(id => id !== calendarId));
    }
    const editTitle = (): void => {
        setMenuOpen(false);
        const text = prompt(`Uusi nimi kalenterille "${calendar?.title}":`, calendar?.title);
        // noinspection JSIgnoredPromiseFromCall
        firestore.collection('calendars').doc(calendarId).set({title: text}, {merge: true});
    };
    const calendarShareUrl = `${document.location.origin}/cal/${calendarId}`;
    const copyToClipboard = () => {
        Clipboard.setString(calendarShareUrl);
    }
    return (
        <Surface style={style.surface}>
            <Portal>
                <Modal contentContainerStyle={{alignItems: 'center'}}
                       visible={shareOpen} onDismiss={() => setShareOpen(false)}>
                    <Surface style={{
                        elevation: 6, padding: 16, alignItems: 'center', position: 'relative',
                        maxWidth: '100%'
                    }}>
                        <IconButton icon="cross" size={16} style={{position: 'absolute', right: 6, top: 6}}
                                    onPress={() => setShareOpen(false)} color={theme.colors.disabled}/>
                        <Headline style={{marginBottom: 4}}>{calendar?.title}</Headline>
                        <Text style={{marginBottom: 8}}>Jaa kalenteri QR-koodilla tai linkillä:</Text>
                        {calendar?.qr_v1 &&
                        <QrImg qr_v1={calendar?.qr_v1}/> ||
                        <ActivityIndicator size="large" style={{width: 164, height: 164}}/>}
                        <Caption style={{marginTop: 8}}>{calendarShareUrl}</Caption>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <IconButton icon="copy" size={16} style={{marginTop: 0}}
                                        onPress={copyToClipboard}/>
                            <Caption>Kopioi leikepöydälle</Caption>
                        </View>
                    </Surface>
                </Modal>
            </Portal>
            <TouchableRipple style={[style.calendarColor, {backgroundColor: calendar?.color}]}
                             onPress={editColor}>
                <View/>
            </TouchableRipple>
            <View style={style.surfaceContent}>
                <View style={style.calendarTitle}>
                    <Subheading numberOfLines={1}
                                style={{flexGrow: 0}}>
                        {!calendarLoading && !calendar?.title &&
                        <ActivityIndicator size="small"/> ||
                        calendar?.title}
                    </Subheading>
                    {!isNarrow &&
                    <IconButton icon="pencil" size={16} color={colors.gray}
                                onPress={editTitle}/>}
                    {!isNarrow &&
                    <IconButton icon="share2" size={16} color={colors.gray}
                                onPress={() => setShareOpen(true)}/>}
                    <View style={{flex: 1}}/>
                    {!isNarrow &&
                    <IconButton style={style.closeButton} icon="cross" color={colors.gray} size={16}
                                onPress={closeCalendar}/>}
                    {isNarrow &&
                    <Menu visible={menuOpen} onDismiss={() => setMenuOpen(false)}
                          anchor={
                              <IconButton style={style.closeButton} icon="more_vert" color={colors.gray}
                                          size={20} onPress={() => setMenuOpen(true)}/>
                          }>
                        <Menu.Item onPress={() => {
                            setMenuOpen(false);
                            setShareOpen(true);
                        }} title="Jaa"/>
                        <Menu.Item onPress={editTitle} title="Muokkaa nimeä"/>
                        <Menu.Item onPress={closeCalendar} title="Sulje"/>
                    </Menu>}
                </View>
                <View style={{flexDirection: 'column'}}>
                    <View>
                        <View style={style.weatherRadio}>
                            <RadioButton value={Weather.Sunny}
                                         color={theme.colors.primary}
                                         status={myWeather?.weather === Weather.Sunny ? 'checked' : 'unchecked'}
                                         onPress={() => setMyWeather(Weather.Sunny)}/>
                            <WeatherIcon weather={Weather.Sunny}
                                         fill={myWeather?.weather === Weather.Sunny
                                             ? theme.colors.primary : colors.gray}/>
                            <Text style={[style.weatherRadioText,
                                myWeather?.weather === Weather.Sunny && style.weatherRadioTextActive]}>
                                On alkaen
                            </Text>
                            <Picker style={[myWeather?.weather !== Weather.Sunny && {opacity: 0.7}]}
                                    selectedValue={myWeather?.from || ''}
                                    onValueChange={time => setMyTime(time)}
                                    enabled={myWeather?.weather === Weather.Sunny}>
                                {Array.from(timeSelectionItems).map(([key, label]) => (
                                    <Picker.Item label={label} value={key} key={label}/>
                                ))}
                            </Picker>
                        </View>
                        <View style={style.weatherRadio}>
                            <RadioButton value={Weather.Rainy}
                                         color={theme.colors.primary}
                                         status={myWeather?.weather === Weather.Rainy ? 'checked' : 'unchecked'}
                                         onPress={() => setMyWeather(Weather.Rainy)}/>
                            <WeatherIcon weather={Weather.Rainy}
                                         fill={myWeather?.weather === Weather.Rainy
                                             ? theme.colors.primary : colors.gray}/>
                            <Text style={[style.weatherRadioText,
                                myWeather?.weather === Weather.Rainy && style.weatherRadioTextActive]}>
                                Ei
                            </Text>
                        </View>
                        <View style={style.weatherRadio}>
                            <RadioButton value={Weather.Stormy}
                                         color={theme.colors.primary}
                                         status={myWeather?.weather === Weather.Stormy ? 'checked' : 'unchecked'}
                                         onPress={() => setMyWeather(Weather.Stormy)}/>
                            <WeatherIcon weather={Weather.Stormy}
                                         fill={myWeather?.weather === Weather.Stormy
                                             ? theme.colors.primary : colors.gray}/>
                            <Text style={[style.weatherRadioText,
                                myWeather?.weather === Weather.Stormy && style.weatherRadioTextActive]}>
                                Ei eikä huomenna
                            </Text>
                        </View>
                    </View>
                    <View style={{flex: 1}}>
                        <Caption>Ilmoittautumiset:</Caption>
                        <View style={style.weatherList}>
                            {weathers?.length === 0
                            && <View style={{marginHorizontal: 10, marginVertical: 8}}><ZzzIcon/></View>}
                            {weathers?.map(weather => (
                                <WeatherChip key={weather.id} weather={weather.weather}
                                             from={weather.from}
                                             isMyWeather={weather.id === userId}/>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        </Surface>
    );
}

const App = () => {
    const [userId, setUserId] = useLocalStorageState<string | null>('userId', null);
    const [date, setDate] = useState(formatDay(new Date));
    useEffect(() => {
        const intervalId = setInterval(() => setDate(formatDay(new Date)), 1000)
        return () => clearInterval(intervalId);
    });
    const [calendarIds, setCalendarIds] = useLocalStorageState<string[]>('calendarIds', []);
    const setIdentity = () => {
        const newUserId = prompt(
            'Jos haluat käyttää useampaa laitetta kirjoita sama tunniste kaikkiin laitteisiin:',
            userId!);
        if (!newUserId || userId! === newUserId) {
            return;
        }
        calendarIds.forEach(calendarId => {
             firestore.collection('calendars').doc(calendarId)
                 .collection('users').doc(userId!).delete();
        });
        setUserId(newUserId);
    };
    if (!userId) {
        setUserId(guid());
    }
    const createCalendar = async () => {
        const newCalendar = await firestore.collection('calendars').add({
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });
        console.log('createCalendar', newCalendar.id);
        appendCalendar(newCalendar.id);
    };
    const joinCalendar = async () => {
        const identifier = prompt("Liity kalenteriin tunnisteella:");
        if (!identifier) {
            return;
        }
        let m = identifier.match(calRegex);
        let calendarId: string|null = null;
        if (m) {
            calendarId = m[1];
        } else if (identifier.match(/^[\w\d]+$/)) {
            calendarId = identifier;
        } else {
            alert(`Kalenteria ei löydy tunnisteella "${identifier}".`);
            return;
        }
        if (calendarIds.includes(calendarId)) {
            alert('Olet jo kyseisessä kalenterissa.');
            return;
        }
        const calendar = await firestore.collection('calendars').doc(calendarId).get();
        if (calendar.exists) {
            appendCalendar(calendarId);
        } else {
            alert(`Kalenteria ei löydy tunnisteella "${calendarId}".`);
        }
    };
    const appendCalendar = (calendarId: string) => {
        setCalendarIds(Array.from(new Set([...calendarIds, calendarId])));
    };
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
            <Appbar.Header>
                <Appbar.Content title={`Onko tänään? ${displayDay(date)}`}/>
                <Appbar.Action icon="user" onPress={setIdentity} color={colors.gray}/>
            </Appbar.Header>
            <View style={style.calendarList}>
                {calendarIds.length === 0 &&
                <View style={{alignItems: 'center'}}>
                    <Image width={128} height={128} source={require('./paivansade.png')}
                           style={{width: 128, height: 128}}/>
                    <Subheading style={{margin: 8, marginBottom: 16, textAlign: 'center'}}>
                        Et ole vielä yhdessäkään sääkalenterissa. Aloita luomalla uusi kalenteri tai liity
                        valmiiseen kalenteriin avaamalla sen linkki.
                    </Subheading>
                </View>}
                {calendarIds.map(calendarId => (
                    <CalendarView calendarId={calendarId} date={date} calendarIds={calendarIds}
                                  setCalendarIds={setCalendarIds} key={calendarId} userId={userId!}/>
                ))}
                <Button onPress={createCalendar} style={{marginBottom: 16}}
                        mode="contained">
                    Luo uusi sääkalenteri
                </Button>
                <Button onPress={() => joinCalendar()} mode="outlined" color={theme.colors.accent}>
                    Liity kalenteriin
                </Button>
            </View>
        </SafeAreaView>
    );
};

export default function Main() {
    return (
        <PaperProvider theme={theme}
                       settings={{icon: props => <Nappi {...props}/>}}>
            <App/>
        </PaperProvider>
    );
}
