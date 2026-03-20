export interface StyleSheet {
	primary: string,
	secondary: string,
	tertiary: string, 
	accent: string,
	background: string,
	secondaryBackground: string,
	borderColor: string,
	textColor: string,
	warning: string,
	borderWidth: string,
	fontSize: string,
	fontSizeH1: string,
	fontSizeH2: string,
	fontSizeH3: string,
	fontSizeH4: string,
	fontSizeH5: string,
	fontSizeH6: string
}

export type ThemeMode = 'light' | 'dark';

let theme: ThemeMode = 'dark';

export function getCurrentStyleSheet(): StyleSheet {
	return {
		borderWidth: '2px',
		fontSize: '1rem',
		fontSizeH1: '2.75rem',
		fontSizeH2: '2rem',
		fontSizeH3: '1.5rem',
		fontSizeH4: '1.125rem',
		fontSizeH5: '0.875rem',
		fontSizeH6: '0.75rem',
		...(theme === 'light'
		? {
			  primary: '#7476fc',
			  secondary: '#5390D9',
			  tertiary: '#48BFE3',
			  accent: '#7400B8',
			  background: '#f5f5f7',
			  secondaryBackground: '#eeeef1',
			  borderColor: '#dddde2',
			  textColor: '#1d1d1f',
			  warning: '#f59e0b'
		  }
		: {
			  primary: '#7476fc',
			  secondary: '#5390D9',
			  tertiary: '#48BFE3',
			  accent: '#7400B8',
			  background: '#141416',
			  secondaryBackground: '#1a1a1e',
			  borderColor: '#28282e',
			  textColor: '#e0e0e4',
			  warning: '#f59e0b'
		  })
	}
}

export function getCurrentTheme(): ThemeMode {
  	return theme;
}

export function setCurrentTheme(newTheme: ThemeMode): ThemeMode {
	theme = newTheme;
	return theme;
}