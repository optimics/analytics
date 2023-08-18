const typeMap = {
  double: 'double_value',
  float: 'float_value',
  int: 'int_value',
  string: 'string_value',
}

const getEventParam = (
  eventParamName,
  eventParamType = 'string',
  columnName = false,
) => {
  const eventParamTypeName = typeMap[eventParamType]
  if (eventParamTypeName) {
    const alias = columnName ? columnName : eventParamName
    return `
      (
        SELECT ep.value.${eventParamTypeName} AS ${eventParamName}
        FROM UNNEST(event_params) ep WHERE ep.key = '${eventParamName}'
      ) AS ${alias}
    `
  }
  throw new Error(
    `The eventType "${eventParamType}" is not valid. Try one of ${Object.keys(
      typeMap,
    ).join(',')}`,
  )
}

module.exports = { getEventParam }
