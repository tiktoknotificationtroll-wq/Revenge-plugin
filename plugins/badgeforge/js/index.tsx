import { getModules } from '@revenge-mod/modules/finders'
import { withName } from '@revenge-mod/modules/finders/filters'
import { before, instead } from '@revenge-mod/patcher'
import { React, ReactJSXRuntime } from '@revenge-mod/react'
import { useSyncExternalStore } from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'
import type { JsonStorage } from '@revenge-mod/json-storage'

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

const badgeIcon = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3c6.png'
type UseBadges = (user: { userId: string } | null) => unknown[]

let storage: JsonStorage<BadgeForgeSettings>
let active = false
let version = 0
const listeners = new Set<() => void>()

function notify() {
  version++
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return version
}

function getShowcaseBadges(userId: string) {
  const settings = { ...defaults, ...storage.cache }
  const entries: { id: string; description: string; icon: string; iconSrc: string }[] = []
  const add = (key: string, label: string) => {
    const clean = label.trim()
    if (!clean) return
    const id = `bf-${userId}-${key}`
    entries.push({ id, description: clean, icon: 'dummy', iconSrc: badgeIcon })
  }

  settings.badges.split(',').forEach((label, index) => add(`badge-${index}`, label))
  if (settings.accountDate.trim()) add('account-date', `Member since ${settings.accountDate.trim()}`)
  settings.games.split('\n').forEach((line, index) => add(`game-${index}`, line.trim()))
  return entries
}

function patchBadgeProps<Args extends [unknown, unknown?, ...unknown[]]>(args: Args): Args {
  const component = args[0]
  const type = component && typeof component === 'object' && 'type' in component
    ? (component as { type: unknown }).type
    : component
  const name = typeof type === 'function' ? type.name : undefined
  if (name !== 'ProfileBadge' || !args[1] || typeof args[1] !== 'object') return args

  const props = args[1] as Record<string, unknown>
  if (!active || typeof props.id !== 'string' || !props.id.startsWith('bf-')) return args
  const userId = props.id.split('-')[1]
  const item = getShowcaseBadges(userId).find(badge => badge.id === props.id)
  if (!item) return args
  args[1] = { ...props, source: { uri: item.iconSrc }, label: item.description, userId }
  return args
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
  start(api) {
    const { cleanup, jsonStorage, plugin: pluginApi } = api
    active = true

    if (pluginApi.startedLate) {
      pluginApi.requireReload()
      return
    }

    storage = jsonStorage
    cleanup(() => {
      active = false
    })
    cleanup(storage.subscribe(() => notify()))

    cleanup(
      getModules(
        withName<UseBadges>('useBadges'),
        module => {
          if (
            !active ||
            !('default' in module) ||
            typeof module.default !== 'function'
          ) return

          cleanup(
            instead(module, 'default', function (args, original) {
              useSyncExternalStore(subscribe, getSnapshot)
              const result = Reflect.apply(original, this, args)
              const user = args[0]
              if (!active || !user?.userId || !Array.isArray(result)) return result

              const existing = new Set(
                result.flatMap(item =>
                  item &&
                  typeof item === 'object' &&
                  'id' in item &&
                  typeof item.id === 'string'
                    ? [item.id]
                    : [],
                ),
              )

              return [
                ...result,
                ...getShowcaseBadges(user.userId).filter(
                  item => !existing.has(item.id),
                ),
              ]
            }),
          )
        },
        { returnNamespace: true, max: Infinity },
      ),
    )

    cleanup(
      before(ReactJSXRuntime, 'jsx', patchBadgeProps),
      before(ReactJSXRuntime, 'jsxs', patchBadgeProps),
      before(React, 'createElement', patchBadgeProps),
    )

    pluginApi.logger.log('BadgeForge profile patches registered')
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
            <Text style={styles.body}>Local profile showcase editor</Text>
            <Text style={styles.note}>These are fictional, device-local cosmetics. They do not change Discord account data and other users will not see them.</Text>
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
            <Text style={styles.body}>Member since {settings.accountDate || 'not set'}</Text>
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
