import { getDataModeInfo } from '../../utils/dataMode.js'

/** Indica de onde vêm os dados exibidos na página (modo efetivo de dados). */
export default function DataSourceBadge({ source }) {
  return (
    <p className="mb-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      Fonte: {getDataModeInfo(source).label}
    </p>
  )
}
