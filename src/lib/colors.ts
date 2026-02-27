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
		fontSize: '15px',
		fontSizeH1: '40px',
		fontSizeH2: '30px',
		fontSizeH3: '20px',
		fontSizeH4: '15px',
		fontSizeH5: '10px',
		fontSizeH6: '5px',
		...(theme === 'light'
		? {
			  primary: '#7476fc',
			  secondary: '#5390D9',
			  tertiary: '#48BFE3',
			  accent: '#7400B8',
			  background: '#ffffff',
			  secondaryBackground: '#f9f9f9',
			  borderColor: '#f0f0f0',
			  textColor: '#2f2f2f',
			  warning: '#f59e0b'
		  }
		: {
			  primary: '#7476fc',
			  secondary: '#5390D9',
			  tertiary: '#48BFE3',
			  accent: '#7400B8',
			  background: '#1c1c1c',
			  secondaryBackground: '#1f1f1f',
			  borderColor: '#2f2f2f',
			  textColor: '#dedede',
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