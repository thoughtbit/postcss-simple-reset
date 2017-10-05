# PostCSS Simple Reset

PostCSS plugin to help you to reset your css via at-rules.

## Syntax

### reset-global

*reset style is dependent on [normalize.css] and combined with best practice.*

`@reset global([pc|mobile])`;


### reset-nested
`@reset nested([tabel|tabel-cell|list|font|boxModel])`;

```css
/* before */
.table {
  @reset nested('table');
  color: #fff;
}

td, th {
  background-color: #fff;
  @reset nested('table-cell');
}

ul, ol {
  @reset nested('list');
}

.regular-font {
  @reset nested('font');
}

.box {
  @reset nested('boxModel');
}

/* after */
.table {
  border-collapse: collapse;
  border-spacing: 0;
  vertical-align: middle;
  color: #fff;
}

td, th {
  background-color: #fff;
  text-align: left;
  font-weight: normal;
  vertical-align: middle;
  margin: 0;
  padding: 0;
}

ul, ol {
  list-style: none;
  margin: 0;
  padding: 0;
}

.regular-font {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
}

.box {
  margin: 0;
  padding: 0;
  width: auto;
  height: auto;
}
```

## 参考

- https://github.com/baiyaaaaa/postcss-css-reset
- https://github.com/ismamz/postcss-utilities
