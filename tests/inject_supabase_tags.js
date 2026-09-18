const fs = require('fs');

function insertScripts(file, searchStr, scriptTags, placeBefore = false) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('assets/js/supabase-client.js')) {
    console.log(file + ' already has supabase scripts.');
    return;
  }
  if (!content.includes(searchStr)) {
    console.error('Could not find searchStr in ' + file);
    return;
  }
  if (placeBefore) {
    content = content.replace(searchStr, scriptTags + '\n  ' + searchStr);
  } else {
    content = content.replace(searchStr, searchStr + '\n' + scriptTags);
  }
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated ' + file);
}

const tags = [
  '  <!-- Supabase Cloud DB & Local-First Sync Engine -->',
  '  <script src="assets/vendor/supabase.min.js"></script>',
  '  <script src="assets/js/supabase-config.js"></script>',
  '  <script src="assets/js/supabase-client.js"></script>',
  '  <script src="assets/js/supabase-ui.js"></script>'
].join('\n');

insertScripts('carbon-inventory.html', '<script src="assets/js/carbon-dashboard.js?v=1788042726.66285"></script>', tags, false);
insertScripts('cbam-dashboard.html', '<script src="assets/js/page-transition.js"></script>', tags, true);
insertScripts('setup.html', '<script src="assets/js/page-transition.js"></script>', tags, true);
