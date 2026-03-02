import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { RootNavigator } from './src/navigation';
import { store, persistor } from './src/store';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import { ThemedAlertProvider } from './src/components/common/ThemedAlert';

export default function App() {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <ErrorBoundary>
                    <ThemedAlertProvider>
                        <SafeAreaProvider>
                            <RootNavigator />
                        </SafeAreaProvider>
                    </ThemedAlertProvider>
                </ErrorBoundary>
            </PersistGate>
        </Provider>
    );
}
