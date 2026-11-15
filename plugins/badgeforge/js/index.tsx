import { ScrollView, Text, TextInput, View } from 'react-native'

interface BadgeForgeSettings {
	badges: string
	accountDate: string
	games: string
}

const defaults: BadgeForgeSettings = {
	badges: 'Early Supporter, Nitro, Server Booster, Developer',
	accountDate: '2017-04-12',
	games: 'Minecraft | 1,250 hours\nFortnite | 840 hours\nValorant | 420 hours',
}

const styles = {
	page: { padding: 16, gap: 14 },
	card: { padding: 14, borderRadius: 12, backgroundColor: '#202225', gap: 8 },
	heading: { color: '#ffffff', fontSize: 18, fontWeight: '700' as const },
	label: { color: '#b9bbbe', fontSize: 13, fontWeight: '600' as const },
	body: { color: '#dcddde', fontSize: 14 },
	note: { color: '#faa61a', fontSize: 12, lineHeight: 17 },
	input: { color: '#ffffff', backgroundColor: '#2f3136', borderRadius: 8, padding: 11, fontSize: 14 },
	previewBadge: { color: '#ffffff', backgroundColor: '#5865f2', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6, overflow: 'hidden' as const, fontSize: 12 },
}

export default plugin<{ jsonStorage: BadgeForgeSettings }>({
	jsonStorage: { load: true, default: defaults },
	start({ logger }) {
		logger.log('BadgeForge loaded. All showcase values are local cosmetics.')
	},
	SettingsComponent({ api }) {
		const settings = api.jsonStorage.use() ?? defaults
		const badges = settings.badges.split(',').map(value => value.trim()).filter(Boolean)
		const games = settings.games.split('\n').map(value => value.trim()).filter(Boolean)

		return (
			<ScrollView>
				<View style={styles.page}>
					<View style={styles.card}>
						<Text style={styles.heading}>BadgeForge</Text>
						<Text style={styles.body}>Build your own fictional profile showcase.</Text>
						<Text style={styles.note}>Cosmetic preview only. These badges, dates and playtime values are stored on this device. They do not change Discord account data or appear to other users.</Text>
					</View>
					<View style={styles.card}>
						<Text style={styles.label}>CUSTOM BADGES</Text>
						<TextInput
							style={styles.input}
							value={settings.badges}
							placeholder="Early Supporter, Nitro..."
							placeholderTextColor="#72767d"
							onChangeText={badges => api.jsonStorage.set({ badges })}
						/>
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
							{badges.map((badge, index) => <Text key={index} style={styles.previewBadge}>{badge}</Text>)}
						</View>
					</View>
					<View style={styles.card}>
						<Text style={styles.label}>FICTIONAL ACCOUNT CREATION DATE</Text>
						<TextInput
							style={styles.input}
							value={settings.accountDate}
							placeholder="YYYY-MM-DD"
							placeholderTextColor="#72767d"
							onChangeText={accountDate => api.jsonStorage.set({ accountDate })}
						/>
						<Text style={styles.body}>Preview: Member since {settings.accountDate || 'not set'}</Text>
					</View>
					<View style={styles.card}>
						<Text style={styles.label}>GAME PLAYTIME</Text>
						<Text style={styles.body}>One game per line, formatted as Game | Hours</Text>
						<TextInput
							style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]}
							value={settings.games}
							multiline
							placeholder={'Minecraft | 1,250 hours'}
							placeholderTextColor="#72767d"
							onChangeText={games => api.jsonStorage.set({ games })}
						/>
						{games.map((game, index) => <Text key={index} style={styles.body}>{game}</Text>)}
					</View>
				</View>
			</ScrollView>
		)
	},
})
