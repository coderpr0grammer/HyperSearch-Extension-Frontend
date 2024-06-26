export const navigateWithQueryVars = (navigate, path) => {
    const currentParams = new URLSearchParams(window.location.search);
    const vid = currentParams.get('vid');
    const theme = currentParams.get('theme');

    const queryParams = new URLSearchParams();
    queryParams.set('vid', vid);
    queryParams.set('theme', theme);

  
    navigate({
      pathname: path,
      search: queryParams.toString()
    }, {replace: true})
  };