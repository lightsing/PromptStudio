import './History.css'
import { ChatConfig, createChatConfig, updateChatConfig } from '../utils/command.ts'
import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridRow,
  TableColumnDefinition,
  createTableColumn,
  DataGridHeader,
  DataGridHeaderCell,
} from '@fluentui/react-components'
import { useTranslation } from 'react-i18next'
import moment from 'moment'
import { Logger } from '../utils/log.ts'
import { useChatHistoryList } from '../utils/hooks.ts'

const logger = new Logger('History.tsx')

type StringCell = {
  label: string
}

type TimeCell = {
  label: string
  timestamp: string
}

type Item = {
  name: StringCell
  model: StringCell
  time: TimeCell
  uuid: string
}

interface HistoryProps {
  setCurrentChatUUID: (uuid: string) => void
  setActivePage: (page: string) => void
}

const History = ({ setCurrentChatUUID, setActivePage }: HistoryProps) => {
  const { t } = useTranslation()
  const { chatHistoryList, removeChat } = useChatHistoryList()

  const createFromTemplate = async ({ uuid }: Item) => {
    const newConfig = await createChatConfig()
    const chatConfig = chatHistoryList!.find((e) => e.uuid === uuid)!
    newConfig.name = `${chatConfig.name || t('Unnamed')} ${t('Copy')}`
    newConfig.prompt = chatConfig.prompt
    newConfig.model = chatConfig.model
    await updateChatConfig(newConfig)
    setCurrentChatUUID(newConfig.uuid)
    setActivePage('editor')
  }

  const columns: TableColumnDefinition<Item>[] = [
    createTableColumn<Item>({
      columnId: 'name',
      renderHeaderCell: () => {
        return t('Name')
      },
      renderCell: (item) => {
        return item.name.label
      },
      compare: (a, b) => {
        return a.name.label.localeCompare(b.name.label)
      },
    }),
    createTableColumn<Item>({
      columnId: 'model',
      renderHeaderCell: () => {
        return t('Model')
      },
      renderCell: (item) => {
        return item.model.label
      },
      compare: (a, b) => {
        return a.model.label.localeCompare(b.model.label)
      },
    }),
    createTableColumn<Item>({
      columnId: 'time',
      renderHeaderCell: () => {
        return t('Time')
      },
      renderCell: (item) => {
        return item.time.label
      },
      compare: (a, b) => {
        return Number(new Date(a.time.timestamp)) - Number(new Date(b.time.timestamp))
      },
    }),
    createTableColumn<Item>({
      columnId: 'operation',
      renderHeaderCell: () => {
        return ''
      },
      renderCell: (item) => {
        return (
          <div className="icon-wrapper history-icon-wrapper">
            <span
              className="icon SubscriptionAdd"
              onClick={(e) => {
                createFromTemplate(item).catch(logger.error('createFromTemplate'))
                e.stopPropagation()
              }}></span>
            <span
              className="icon Delete"
              onClick={(e) => {
                removeChat(item.uuid).catch(logger.error('deleteItem'))
                e.stopPropagation()
              }}></span>
          </div>
        )
      },
    }),
  ]

  function getItems(chatConfig: ChatConfig[]): Item[] {
    return chatConfig.map((item) => {
      const { name, model, createdAt } = item
      return {
        name: {
          label: name ?? t('Unnamed'),
        },
        model: {
          label: model ?? '',
        },
        time: {
          label: String(moment(createdAt).fromNow()),
          timestamp: createdAt,
        },
        uuid: item.uuid,
      }
    })
  }

  async function clickRow(item: Item) {
    setCurrentChatUUID(item.uuid)
    setActivePage('editor')
  }

  return (
    <div className="history">
      <h1>{t('Page.History')}</h1>
      <DataGrid
        className="history-table"
        items={getItems(chatHistoryList || [])}
        columns={columns}
        getRowId={(item) => item.uuid}
        onSelectionChange={(_, data) => console.log(data)}
        focusMode="composite"
        sortable={true}>
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
          </DataGridRow>
        </DataGridHeader>
        <div className="history-body-wrapper">
          <DataGridBody<Item>>
            {({ item }) => (
              <DataGridRow<Item> key={item.uuid} onClick={() => clickRow(item)}>
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </div>
      </DataGrid>
    </div>
  )
}

export default History
